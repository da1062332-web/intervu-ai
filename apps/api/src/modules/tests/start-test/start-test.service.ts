import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { StartTestDto } from "./dto/start-test.dto";
import { EligibilityService } from "../../lifecycle/eligibility.service";
import { TestConfigRepository } from "../repositories/test-config.repository";
import { QuestionProviderService } from "./question-provider.service";
import { TestInstanceService } from "../test-instance/test-instance.service";
import { TestInstanceStatus, Prisma } from "@prisma/client";

@Injectable()
export class StartTestService {
  constructor(
    private readonly eligibilityService: EligibilityService,
    private readonly testConfigRepository: TestConfigRepository,
    private readonly questionProvider: QuestionProviderService,
    private readonly testInstanceService: TestInstanceService,
  ) {}

  async startTest(userId: string, input: StartTestDto) {
    // 1. validate(input) -> Fetch Dependencies
    const eligibility = await this.eligibilityService.validateEligibility(
      userId,
      input.testConfigId,
    );

    if (!eligibility.eligible) {
      throw new BadRequestException({
        code: eligibility.errorCode || "USER_NOT_ELIGIBLE",
        message: eligibility.reason || "User not eligible",
      });
    }

    const config = await this.testConfigRepository.findByIdWithSections(
      input.testConfigId,
    );

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
        message: "Failed to assemble test sections",
      });
    }

    // 3. Create Test Instance
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + config.totalDurationSeconds);

    const testInstance = await this.testInstanceService.createTestInstance({
      userId,
      testConfigId: config.id,
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
