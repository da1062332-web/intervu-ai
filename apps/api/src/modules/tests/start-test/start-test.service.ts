import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
  Optional,
  Inject,
} from "@nestjs/common";
import { StartTestDto } from "./dto/start-test.dto";
import { EligibilityService } from "../../lifecycle/eligibility.service";
import { TestConfigRepository } from "../repositories/test-config.repository";
import { QuestionProviderService } from "./question-provider.service";
import { AssembledTestRepository } from "../../assembly/repositories/assembled-test.repository";
import { TestInstanceService } from "../test-instance/test-instance.service";
import { TestInstanceStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { FinalShufflerService } from "./final-shuffler.service";
import { AssemblyService } from "../../assembly/services/test-assembly.service";

@Injectable()
export class StartTestService {
  private readonly logger = new Logger(StartTestService.name);

  constructor(
    private readonly eligibilityService: EligibilityService,
    private readonly testConfigRepository: TestConfigRepository,
    private readonly questionProvider: QuestionProviderService,
    private readonly assembledTestRepository: AssembledTestRepository,
    private readonly testInstanceService: TestInstanceService,
    private readonly prisma: PrismaService,
    private readonly finalShufflerService: FinalShufflerService,
    @Optional() @Inject(AssemblyService) private readonly assemblyService?: AssemblyService,
  ) {}

  async startTest(userId: string, input: StartTestDto) {
    const startOverall = Date.now();
    this.logger.log(`\n================================================================================`);
    this.logger.log(`[START-TEST 🚀] START TEST INITIATED | User: ${userId} | Config: ${input.testConfigId}`);
    this.logger.log(`================================================================================`);

    // 1. validate(input) -> Fetch Dependencies
    const t0 = Date.now();
    this.logger.log(`[START-TEST ⏱️] Step 1/5: Validating candidate eligibility...`);
    const eligibility = await this.eligibilityService.validateEligibility(
      userId,
      input.testConfigId,
    );
    const targetConfigId = eligibility.resolvedConfigId || input.testConfigId;
    this.logger.log(`[START-TEST ✅] Step 1/5: Eligibility validated in ${Date.now() - t0}ms (Eligible: ${eligibility.eligible}, isExamConfig: ${eligibility.isExamConfig})`);

    if (!eligibility.eligible) {
      if (
        eligibility.errorCode === "ACTIVE_TEST_EXISTS" &&
        eligibility.activeTestId
      ) {
        // Return existing active instance for idempotency
        let durationSeconds = 3600;
        if (eligibility.isExamConfig) {
          const config = await this.prisma.examConfig.findUnique({ where: { id: targetConfigId } });
          if (config) durationSeconds = config.durationMinutes * 60;
        } else {
          const config = await this.testConfigRepository.findById(
            targetConfigId,
          );
          if (config) durationSeconds = config.totalDurationSeconds;
        }

        this.logger.log(`[START-TEST ℹ️] Active instance already exists: ${eligibility.activeTestId}. Returning existing instance in ${Date.now() - startOverall}ms.`);
        return {
          testInstanceId: eligibility.activeTestId,
          status: TestInstanceStatus.IN_PROGRESS,
          instructionsUrl: `/test/${eligibility.activeTestId}/instructions`,
          durationSeconds,
        };
      }
      this.logger.warn(`[START-TEST ❌] Eligibility check failed: ${eligibility.reason || eligibility.errorCode}`);
      throw new BadRequestException({
        code: eligibility.errorCode || "USER_NOT_ELIGIBLE",
        message: eligibility.reason || "User not eligible",
      });
    }

    const t1 = Date.now();
    this.logger.log(`[START-TEST ⏱️] Step 2/5: Fetching test configuration and section blueprint...`);
    let config: any;
    if (eligibility.isExamConfig) {
      config = await this.prisma.examConfig.findUnique({
        where: { id: targetConfigId },
        include: {
          sections: { orderBy: { sectionOrder: "asc" } },
          blueprint: true,
          ruleFlags: true,
        },
      });
      if (config) {
        config.totalDurationSeconds = (config.durationMinutes || 60) * 60;
        config.sectionTimingEnabled =
          config.ruleFlags?.sectionTimingEnabled ?? false;
        const numSections = config.sections.length || 1;
        config.sections = config.sections.map((s: any, index: number) => {
          let conceptKey = s.code
            ? `CONCEPT_${s.code}`
            : s.name.toLowerCase().replace(/ /g, "_");
          if (config.blueprint && Array.isArray(config.blueprint.sections)) {
            const bpSection = config.blueprint.sections.find(
              (bs: any) => bs.sectionId === s.id,
            );
            if (
              bpSection &&
              bpSection.topicAllocations?.[0]?.concepts?.[0]?.conceptName
            ) {
              conceptKey = bpSection.topicAllocations[0].concepts[0].conceptName
                .replace(/\s+/g, "_")
                .toUpperCase();
            }
          }
          // Use the explicitly defined section duration if available, otherwise divide total duration evenly.
          const sectionDurationSeconds = s.sectionDurationMinutes
            ? s.sectionDurationMinutes * 60
            : Math.floor(config.totalDurationSeconds / numSections);
          return {
            ...s,
            displayName: s.name,
            sectionKey: conceptKey,
            durationSeconds: sectionDurationSeconds,
            orderIndex: s.sectionOrder ?? index,
          };
        });
      }
    } else {
      config = await this.testConfigRepository.findByIdWithSections(
        targetConfigId,
      );
      if (config && (!config.totalDurationSeconds || config.totalDurationSeconds <= 0)) {
        config.totalDurationSeconds = 3600; // Default to 1 hour if not set or 0
      }
    }

    if (!config) {
      this.logger.error(`[START-TEST ❌] Test configuration not found for ID: ${targetConfigId}`);
      throw new BadRequestException({
        code: "TEST_CONFIG_NOT_FOUND",
        message: "Test configuration not found",
      });
    }
    this.logger.log(`[START-TEST ✅] Step 2/5: Config loaded in ${Date.now() - t1}ms ("${config.name || config.title}", Sections: ${config.sections?.length}, TotalDuration: ${config.totalDurationSeconds}s)`);

    // Dynamic candidate-unique assembly ONLY when candidateNoRepeatEnabled flag is active AND candidate is taking a Retest attempt
    const t2 = Date.now();
    this.logger.log(`[START-TEST ⏱️] Step 3/5: Checking attempt history & candidateNoRepeat rule flags...`);
    const previousAttempts = await this.prisma.testInstance.findMany({
      where: {
        userId,
        OR: [{ examConfigId: targetConfigId }, { testConfigId: targetConfigId }],
        status: { in: [TestInstanceStatus.SUBMITTED, TestInstanceStatus.COMPLETED] },
      },
    });

    const isRetest = previousAttempts.length > 0;
    const isCandidateNoRepeat = config.ruleFlags?.candidateNoRepeatEnabled ?? false;
    this.logger.log(`[START-TEST ℹ️] Step 3/5: Checked history in ${Date.now() - t2}ms (PreviousAttempts: ${previousAttempts.length}, isRetest: ${isRetest}, candidateNoRepeat: ${isCandidateNoRepeat})`);

    if (isCandidateNoRepeat && isRetest && this.assemblyService) {
      this.logger.log(`[START-TEST 🤖] Flow 2 Active: Dynamic AI Retest Mode triggered. Assembling progressive test instance...`);
      const tAi = Date.now();
      const candidateInstanceId = await this.assemblyService.assembleTest(
        targetConfigId,
        userId,
        false,
        { progressive: true, isRetest: true },
      );
      const instanceRecord = await this.prisma.testInstance.findUnique({
        where: { id: candidateInstanceId },
      });
      this.logger.log(`[START-TEST 🚀] Flow 2 Completed in ${Date.now() - tAi}ms! Instance: ${candidateInstanceId} | Total start time: ${Date.now() - startOverall}ms`);
      return {
        testInstanceId: candidateInstanceId,
        status: instanceRecord?.status || TestInstanceStatus.CREATED,
        instructionsUrl: `/test/${candidateInstanceId}/instructions`,
        durationSeconds: config.totalDurationSeconds || 3600,
      };
    }

    // 2. Assembly
    if (!this.assemblyService) {
      throw new InternalServerErrorException({
        code: "ASSEMBLY_SERVICE_UNAVAILABLE",
        message: "Assembly service is required for candidate test creation.",
      });
    }

    const t3 = Date.now();
    this.logger.log(`[START-TEST ⏱️] Step 4/5: Invoking AssemblyService.assembleTest...`);
    let testInstanceId: string;
    try {
      testInstanceId = await this.assemblyService.assembleTest(
        targetConfigId,
        userId,
        false,
        { progressive: true },
      );
      this.logger.log(`[START-TEST ✅] Step 4/5: AssemblyService completed in ${Date.now() - t3}ms -> Instance ID: ${testInstanceId}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[START-TEST ❌] Failed assembling test for candidate ${userId}, configId: ${targetConfigId}. Cause: ${errorMsg}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException({
        code: "ASSEMBLY_FAILED",
        message: `Failed to assemble test: ${errorMsg}`,
      });
    }

    const t4 = Date.now();
    this.logger.log(`[START-TEST ⏱️] Step 5/5: Verifying created TestInstance in DB...`);
    const testInstance = await this.testInstanceService.getTestInstance(testInstanceId, false);
    if (!testInstance) {
      this.logger.error(`[START-TEST ❌] Test instance record ${testInstanceId} not found in DB!`);
      throw new InternalServerErrorException({
        code: "TEST_INSTANCE_CREATION_FAILED",
        message: "Failed to fetch created test instance after assembly",
      });
    }
    this.logger.log(`[START-TEST ✅] Step 5/5: Instance verified in ${Date.now() - t4}ms (Status: ${testInstance.status})`);

    const totalMs = Date.now() - startOverall;
    this.logger.log(`================================================================================`);
    this.logger.log(`[START-TEST 🚀⚡] TEST START COMPLETE IN ${totalMs}ms (< ${(totalMs / 1000).toFixed(2)}s) | Instance: ${testInstance.id}`);
    this.logger.log(`================================================================================\n`);

    // 4. formatResponse(result)
    return {
      testInstanceId: testInstance.id,
      status: testInstance.status,
      instructionsUrl: `/test/${testInstance.id}/instructions`,
      durationSeconds: config.totalDurationSeconds,
    };
  }
}
