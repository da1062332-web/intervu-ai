import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  Optional,
  Inject,
} from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";
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
import { EntitlementService } from "../../billing/services/entitlement.service";
import { UsageQuotaService } from "../../billing/services/usage-quota.service";

@Injectable()
export class StartTestService {
  private readonly logger = new AppLogger({ name: "StartTestService" });

  constructor(
    private readonly eligibilityService: EligibilityService,
    private readonly testConfigRepository: TestConfigRepository,
    private readonly questionProvider: QuestionProviderService,
    private readonly assembledTestRepository: AssembledTestRepository,
    private readonly testInstanceService: TestInstanceService,
    private readonly prisma: PrismaService,
    private readonly finalShufflerService: FinalShufflerService,
    @Optional() @Inject(AssemblyService) private readonly assemblyService?: AssemblyService,
    @Optional() private readonly entitlementService?: EntitlementService,
    @Optional() private readonly usageQuotaService?: UsageQuotaService,
  ) {}

  async startTest(userId: string, input: StartTestDto) {
    const startOverall = Date.now();
    this.logger.info(
      `[START-TEST 🚀] START TEST INITIATED | User: ${userId} | Config: ${input.testConfigId}`,
      { userId, testConfigId: input.testConfigId },
    );

    // 1. validate(input) -> Fetch Dependencies
    const t0 = Date.now();
    this.logger.info(`[START-TEST ⏱️] Step 1/5: Validating candidate eligibility...`, {
      userId,
      testConfigId: input.testConfigId,
    });
    const eligibility = await this.eligibilityService.validateEligibility(
      userId,
      input.testConfigId,
    );
    const targetConfigId = eligibility.resolvedConfigId || input.testConfigId;
    this.logger.info(
      `[START-TEST ✅] Step 1/5: Eligibility validated in ${Date.now() - t0}ms (Eligible: ${eligibility.eligible}, isExamConfig: ${eligibility.isExamConfig})`,
      {
        userId,
        testConfigId: input.testConfigId,
        targetConfigId,
        eligible: eligibility.eligible,
        isExamConfig: eligibility.isExamConfig,
        durationMs: Date.now() - t0,
      },
    );

    if (!eligibility.eligible) {
      if (
        eligibility.errorCode === "ACTIVE_TEST_EXISTS" &&
        eligibility.activeTestId
      ) {
        // Return existing active instance for idempotency without consuming new quota
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

        this.logger.info(
          `[START-TEST ℹ️] Active instance already exists: ${eligibility.activeTestId}. Returning existing instance in ${Date.now() - startOverall}ms.`,
          {
            userId,
            testConfigId: targetConfigId,
            activeTestId: eligibility.activeTestId,
            durationMs: Date.now() - startOverall,
          },
        );
        return {
          testInstanceId: eligibility.activeTestId,
          status: TestInstanceStatus.IN_PROGRESS,
          instructionsUrl: `/test/${eligibility.activeTestId}/instructions`,
          durationSeconds,
        };
      }
      this.logger.warn(
        `[START-TEST ❌] Eligibility check failed for user ${userId}: ${eligibility.reason || eligibility.errorCode}`,
        {
          userId,
          testConfigId: input.testConfigId,
          targetConfigId,
          errorCode: eligibility.errorCode,
          reason: eligibility.reason,
        },
      );
      throw new BadRequestException({
        code: eligibility.errorCode || "USER_NOT_ELIGIBLE",
        message: eligibility.reason || "User not eligible",
      });
    }

    // 2. Atomic Round Quota Consumption (Prevents concurrent over-consumption)
    if (this.entitlementService) {
      const quotaResult = await this.entitlementService.consumeRound(userId);
      if (!quotaResult.allowed) {
        this.logger.warn(`[START-TEST ❌] User ${userId} has exhausted assessment quota`, {
          userId,
          targetConfigId,
        });
        throw new ForbiddenException({
          code: "QUOTA_EXHAUSTED",
          message: "Your assessment quota has been exhausted. Purchase a new plan to continue.",
        });
      }
    }

    const t1 = Date.now();
    this.logger.info(`[START-TEST ⏱️] Step 2/5: Fetching test configuration and section blueprint...`, {
      userId,
      targetConfigId,
    });
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
      this.logger.error(
        `[START-TEST ❌] Test configuration not found for ID: ${targetConfigId}`,
        undefined,
        { userId, targetConfigId },
      );
      throw new BadRequestException({
        code: "TEST_CONFIG_NOT_FOUND",
        message: "Test configuration not found",
      });
    }
    this.logger.info(
      `[START-TEST ✅] Step 2/5: Config loaded in ${Date.now() - t1}ms ("${config.name || config.title}", Sections: ${config.sections?.length}, TotalDuration: ${config.totalDurationSeconds}s)`,
      {
        userId,
        targetConfigId,
        configName: config.name || config.title,
        sectionsCount: config.sections?.length,
        totalDurationSeconds: config.totalDurationSeconds,
        durationMs: Date.now() - t1,
      },
    );

    // Dynamic candidate-unique assembly ONLY when candidateNoRepeatEnabled flag is active AND candidate is taking a Retest attempt
    const t2 = Date.now();
    this.logger.info(`[START-TEST ⏱️] Step 3/5: Checking attempt history & candidateNoRepeat rule flags...`, {
      userId,
      targetConfigId,
    });
    const previousAttempts = this.prisma?.testInstance?.findMany
      ? await this.prisma.testInstance.findMany({
          where: {
            userId,
            OR: [{ examConfigId: targetConfigId }, { testConfigId: targetConfigId }],
            status: { in: [TestInstanceStatus.SUBMITTED, TestInstanceStatus.COMPLETED] },
          },
        })
      : [];

    const isRetest = previousAttempts.length > 0;
    const isCandidateNoRepeat = config.ruleFlags?.candidateNoRepeatEnabled ?? false;
    this.logger.info(
      `[START-TEST ℹ️] Step 3/5: Checked history in ${Date.now() - t2}ms (PreviousAttempts: ${previousAttempts.length}, isRetest: ${isRetest}, candidateNoRepeat: ${isCandidateNoRepeat})`,
      {
        userId,
        targetConfigId,
        previousAttemptsCount: previousAttempts.length,
        isRetest,
        isCandidateNoRepeat,
        durationMs: Date.now() - t2,
      },
    );

    if (isCandidateNoRepeat && isRetest && this.assemblyService) {
      this.logger.info(
        `[START-TEST 🤖] Flow 2 Active: Dynamic AI Retest Mode triggered. Assembling progressive test instance...`,
        { userId, targetConfigId },
      );
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
      this.logger.info(
        `[START-TEST 🚀] Flow 2 Completed in ${Date.now() - tAi}ms! Instance: ${candidateInstanceId} | Total start time: ${Date.now() - startOverall}ms`,
        {
          userId,
          targetConfigId,
          testInstanceId: candidateInstanceId,
          assemblyDurationMs: Date.now() - tAi,
          totalDurationMs: Date.now() - startOverall,
        },
      );
      return {
        testInstanceId: candidateInstanceId,
        status: instanceRecord?.status || TestInstanceStatus.CREATED,
        instructionsUrl: `/test/${candidateInstanceId}/instructions`,
        durationSeconds: config.totalDurationSeconds || 3600,
      };
    }

    // 2. Assembly
    if (!this.assemblyService) {
      this.logger.error(
        `[START-TEST ❌] Assembly service is unavailable in StartTestService`,
        undefined,
        { userId, targetConfigId },
      );
      throw new InternalServerErrorException({
        code: "ASSEMBLY_SERVICE_UNAVAILABLE",
        message: "Assembly service is required for candidate test creation.",
      });
    }

    const t3 = Date.now();
    this.logger.info(`[START-TEST ⏱️] Step 4/5: Invoking AssemblyService.assembleTest...`, {
      userId,
      targetConfigId,
    });
    let testInstanceId: string;
    try {
      testInstanceId = await this.assemblyService.assembleTest(
        targetConfigId,
        userId,
        false,
        { progressive: true },
      );
      this.logger.info(
        `[START-TEST ✅] Step 4/5: AssemblyService completed in ${Date.now() - t3}ms -> Instance ID: ${testInstanceId}`,
        {
          userId,
          targetConfigId,
          testInstanceId,
          durationMs: Date.now() - t3,
        },
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `[START-TEST ❌] Failed assembling test for candidate ${userId}, configId: ${targetConfigId}. Cause: ${errorMsg}`,
        error,
        { userId, targetConfigId, errorMsg },
      );
      throw new InternalServerErrorException({
        code: "ASSEMBLY_FAILED",
        message: `Failed to assemble test: ${errorMsg}`,
      });
    }

    const t4 = Date.now();
    this.logger.info(`[START-TEST ⏱️] Step 5/5: Verifying created TestInstance in DB...`, {
      userId,
      testInstanceId,
    });
    const testInstance = await this.testInstanceService.getTestInstance(testInstanceId, false);
    if (!testInstance) {
      this.logger.error(
        `[START-TEST ❌] Test instance record ${testInstanceId} not found in DB!`,
        undefined,
        { userId, testInstanceId },
      );
      throw new InternalServerErrorException({
        code: "TEST_INSTANCE_CREATION_FAILED",
        message: "Failed to fetch created test instance after assembly",
      });
    }
    this.logger.info(
      `[START-TEST ✅] Step 5/5: Instance verified in ${Date.now() - t4}ms (Status: ${testInstance.status})`,
      {
        userId,
        testInstanceId,
        status: testInstance.status,
        durationMs: Date.now() - t4,
      },
    );

    const totalMs = Date.now() - startOverall;
    this.logger.info(
      `[START-TEST 🚀⚡] TEST START COMPLETE IN ${totalMs}ms (< ${(totalMs / 1000).toFixed(2)}s) | Instance: ${testInstance.id}`,
      {
        userId,
        testConfigId: targetConfigId,
        testInstanceId: testInstance.id,
        status: testInstance.status,
        totalDurationMs: totalMs,
      },
    );

    // 4. formatResponse(result)
    return {
      testInstanceId: testInstance.id,
      status: testInstance.status,
      instructionsUrl: `/test/${testInstance.id}/instructions`,
      durationSeconds: config.totalDurationSeconds,
    };
  }
}
