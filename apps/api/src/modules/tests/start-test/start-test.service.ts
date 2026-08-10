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
    // 1. validate(input) -> Fetch Dependencies
    const eligibility = await this.eligibilityService.validateEligibility(
      userId,
      input.testConfigId,
    );

    const targetConfigId = eligibility.resolvedConfigId || input.testConfigId;

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

        return {
          testInstanceId: eligibility.activeTestId,
          status: TestInstanceStatus.IN_PROGRESS,
          instructionsUrl: `/test/${eligibility.activeTestId}/instructions`,
          durationSeconds,
        };
      }
      throw new BadRequestException({
        code: eligibility.errorCode || "USER_NOT_ELIGIBLE",
        message: eligibility.reason || "User not eligible",
      });
    }

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
      throw new BadRequestException({
        code: "TEST_CONFIG_NOT_FOUND",
        message: "Test configuration not found",
      });
    }

    // Dynamic candidate-unique assembly ONLY when candidateNoRepeatEnabled flag is active AND candidate is taking a Retest attempt
    const previousAttempts = await this.prisma.testInstance.findMany({
      where: {
        userId,
        OR: [{ examConfigId: targetConfigId }, { testConfigId: targetConfigId }],
        status: { in: [TestInstanceStatus.SUBMITTED, TestInstanceStatus.COMPLETED] },
      },
    });

    const isRetest = previousAttempts.length > 0;
    const isCandidateNoRepeat = config.ruleFlags?.candidateNoRepeatEnabled ?? false;

    if (isCandidateNoRepeat && isRetest && this.assemblyService) {
      const candidateInstanceId = await this.assemblyService.assembleTest(targetConfigId, userId);
      const instanceRecord = await this.prisma.testInstance.findUnique({
        where: { id: candidateInstanceId },
      });
      return {
        testInstanceId: candidateInstanceId,
        status: instanceRecord?.status || TestInstanceStatus.CREATED,
        instructionsUrl: `/test/${candidateInstanceId}/instructions`,
        durationSeconds: config.totalDurationSeconds || 3600,
      };
    }

    // 2. coreLogic(data) -> Assembly
    // Prefer a published AssembledTest snapshot for this configId if available.
    let sectionsData = [];

    try {
      const assembly = await this.assembledTestRepository.findByConfigId(
        targetConfigId,
      );

      if (assembly) {
        // Use persisted snapshot directly
        for (const section of assembly.sections || []) {
          const questions = (section.questions || [])
            .sort((a, b) => a.questionOrder - b.questionOrder)
            .map((q) => ({
              questionId: q.questionId,
              questionOrder: q.questionOrder,
              questionSnapshot:
                q.questionSnapshot as unknown as Prisma.InputJsonValue,
            }));

          sectionsData.push({
            sectionKey: section.sectionKey,
            sectionName: section.sectionName,
            durationSeconds: section.durationSeconds,
            questionCount: section.questionCount,
            orderIndex: section.orderIndex,
            questions,
          });
        }
      } else {
        // No published snapshot — fall back to live generation
        for (const section of config.sections) {
          const questions =
            await this.questionProvider.fetchOrGenerateQuestions([
              {
                conceptKey: section.sectionKey, // MVP: assume sectionKey acts as conceptKey
                difficultyLevel: "MEDIUM",
                count: section.questionCount,
              },
            ]);

          sectionsData.push({
            sectionKey: section.sectionKey,
            sectionName: section.displayName,
            durationSeconds: section.durationSeconds,
            questionCount: section.questionCount,
            orderIndex: section.orderIndex,
            questions: questions.map((q, index) => ({
              questionId: q.id,
              questionOrder: index,
              questionSnapshot: q as unknown as Prisma.InputJsonValue,
            })),
          });
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed assembling test sections for configId: ${input.testConfigId}. Cause: ${errorMsg}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof InternalServerErrorException) {
        const res = error.getResponse();
        if (
          res &&
          typeof res === "object" &&
          "code" in res &&
          (res as { code: string }).code === "QUESTION_POOL_EMPTY"
        ) {
          throw error;
        }
        if (typeof res === "string" && res.includes("QUESTION_POOL_EMPTY")) {
          throw error;
        }
      }
      throw new InternalServerErrorException({
        code: "ASSEMBLY_FAILED",
        message: `Failed to assemble test sections: ${errorMsg}`,
      });
    }

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + config.totalDurationSeconds);

    // Final Shuffle
    const shuffleFlags = {
      shuffleQuestionsEnabled:
        config.ruleFlags?.shuffleQuestionsEnabled ?? false,
      shuffleOptionsEnabled: config.ruleFlags?.shuffleOptionsEnabled ?? false,
    };

    sectionsData = this.finalShufflerService.shuffleSections(
      sectionsData as any,
      shuffleFlags,
    );

    const testInstance = await this.testInstanceService.createTestInstance({
      userId,
      testConfigId: eligibility.isExamConfig ? undefined : config.id,
      examConfigId: eligibility.isExamConfig ? config.id : undefined,
      status: TestInstanceStatus.CREATED,
      expiresAt,
      sections: sectionsData,
    });

    if (!testInstance) {
      throw new InternalServerErrorException({
        code: "TEST_INSTANCE_CREATION_FAILED",
        message: "Failed to fetch created test instance",
      });
    }

    // 4. formatResponse(result)
    return {
      testInstanceId: testInstance.id,
      status: testInstance.status,
      instructionsUrl: `/test/${testInstance.id}/instructions`,
      durationSeconds: config.totalDurationSeconds,
    };
  }
}
