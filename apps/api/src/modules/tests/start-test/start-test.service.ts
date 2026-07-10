import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { StartTestDto } from "./dto/start-test.dto";
import { EligibilityService } from "../../lifecycle/eligibility.service";
import { TestConfigRepository } from "../repositories/test-config.repository";
import { QuestionProviderService } from "./question-provider.service";
import { TestInstanceService } from "../test-instance/test-instance.service";
import { TestInstanceStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class StartTestService {
  private readonly logger = new Logger(StartTestService.name);

  constructor(
    private readonly eligibilityService: EligibilityService,
    private readonly testConfigRepository: TestConfigRepository,
    private readonly questionProvider: QuestionProviderService,
    private readonly testInstanceService: TestInstanceService,
    private readonly prisma: PrismaService,
  ) {}

  async startTest(userId: string, input: StartTestDto) {
    // 1. validate(input) -> Fetch Dependencies
    const eligibility = await this.eligibilityService.validateEligibility(
      userId,
      input.testConfigId,
    );

    if (!eligibility.eligible) {
      if (
        eligibility.errorCode === "ACTIVE_TEST_EXISTS" &&
        eligibility.activeTestId
      ) {
        // Return existing active instance for idempotency
        let durationSeconds = 3600;
        if (eligibility.isExamConfig) {
          const config = await this.prisma.examConfig.findUnique({ where: { id: input.testConfigId } });
          if (config) durationSeconds = config.durationMinutes * 60;
        } else {
          const config = await this.testConfigRepository.findById(
            input.testConfigId,
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
        where: { id: input.testConfigId },
        include: { sections: true }
      });
      if (config) {
        config.totalDurationSeconds = config.durationMinutes * 60;
        config.sections = config.sections.map((s: any) => ({
          ...s,
          displayName: s.name,
          sectionKey: s.name.toLowerCase().replace(/ /g, '_'),
          durationSeconds: config.durationMinutes * 60 / config.sections.length,
          orderIndex: 0
        }));
      }
    } else {
      config = await this.testConfigRepository.findByIdWithSections(
        input.testConfigId,
      );
    }

    if (!config) {
      throw new BadRequestException({
        code: "TEST_CONFIG_NOT_FOUND",
        message: "Test configuration not found",
      });
    }

    // 2. coreLogic(data) -> Assembly
    const sectionsData = [];

    try {
      for (const section of config.sections) {
        const questions = await this.questionProvider.fetchOrGenerateQuestions([
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

    // 3. Create Test Instance
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + config.totalDurationSeconds);

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
