import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";
import {
  TestInstance,
  ExecutionState,
  Prisma,
  ConfigStatus,
} from "@prisma/client";
import { TestInstanceRepository } from "../repositories";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class ExecutionValidatorService {
  private readonly logger = new AppLogger({
    name: "ExecutionValidatorService",
  });

  constructor(
    private readonly testInstanceRepo: TestInstanceRepository,
    private readonly prisma: PrismaService,
  ) {}

  async validateAssessment(
    testInstanceId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<TestInstance> {
    const repo = tx
      ? this.testInstanceRepo.withTransaction(tx)
      : this.testInstanceRepo;
    const testInstance = await repo.findById(testInstanceId);

    if (!testInstance) {
      this.logger.warn("Validation failed: Assessment not found", {
        testInstanceId,
      });
      throw new NotFoundException({
        code: "ASSESSMENT_NOT_FOUND",
        message: "Assessment not found",
      });
    }

    return testInstance;
  }

  validateOwnership(testInstance: TestInstance, userId: string): void {
    if (testInstance.userId !== userId) {
      this.logger.warn("Validation failed: Ownership check failed", {
        testInstanceId: testInstance.id,
        userId,
      });
      throw new ForbiddenException({
        code: "UNAUTHORIZED_ACCESS",
        message: "You do not own this assessment",
      });
    }
  }

  validateSubmissionState(testInstance: TestInstance): void {
    if (
      testInstance.status === "SUBMITTED" ||
      testInstance.status === "COMPLETED"
    ) {
      this.logger.warn("Validation failed: Assessment already submitted", {
        testInstanceId: testInstance.id,
        status: testInstance.status,
      });
      throw new ConflictException({
        code: "ASSESSMENT_ALREADY_SUBMITTED",
        message: "Assessment has already been submitted",
      });
    }
  }

  validateTimer(
    testInstance: TestInstance,
    executionState: ExecutionState | null,
    providedRemainingTime?: number,
  ): { isExpired: boolean; actualRemainingTime: number } {
    if (testInstance.expiresAt && testInstance.expiresAt < new Date()) {
      return { isExpired: true, actualRemainingTime: 0 };
    }

    if (executionState && executionState.remainingTimeSeconds <= 0) {
      return { isExpired: true, actualRemainingTime: 0 };
    }

    // Backend authoritative remaining time takes precedence over provided remaining time.
    let actualRemainingTime =
      executionState?.remainingTimeSeconds ?? providedRemainingTime ?? 0;

    if (testInstance.expiresAt) {
      const timeToExpiry = Math.floor(
        (testInstance.expiresAt.getTime() - Date.now()) / 1000,
      );
      if (timeToExpiry <= 0) {
        return { isExpired: true, actualRemainingTime: 0 };
      }
      if (actualRemainingTime === 0 || timeToExpiry < actualRemainingTime) {
        actualRemainingTime = timeToExpiry;
      }
    }

    return {
      isExpired: actualRemainingTime <= 0,
      actualRemainingTime,
    };
  }

  validateQuestion(testInstanceId: string, questionId: string): void {
    if (!questionId) {
      this.logger.warn("Validation failed: Invalid question ID", {
        testInstanceId,
        questionId,
      });
      throw new BadRequestException({
        code: "INVALID_QUESTION",
        message: "Question ID is invalid",
      });
    }
  }

  async validateRuntimeSession(
    testInstanceId: string,
    userId: string,
  ): Promise<{ isValid: boolean; message: string }> {
    this.logger.debug("Running deep runtime integrity validation", {
      testInstanceId,
      userId,
    });

    // 1. Validate assessment presence
    const testInstance = await this.validateAssessment(testInstanceId);

    // 2. Validate Authorization / Ownership
    this.validateOwnership(testInstance, userId);

    // 3. Validate Attempt Status (Already Submitted Attempts)
    this.validateSubmissionState(testInstance);

    // 4. Fetch associated TestConfig
    const testConfig = await this.prisma.testConfig.findUnique({
      where: { id: testInstance.testConfigId },
    });

    if (!testConfig) {
      throw new NotFoundException({
        code: "TEST_CONFIG_NOT_FOUND",
        message: "Associated test configuration not found",
      });
    }

    // 5. Validate Assessment Availability & Publish Status
    if (!testConfig.isActive) {
      throw new BadRequestException({
        code: "ASSESSMENT_INACTIVE",
        message:
          "This assessment configuration is currently inactive/unavailable",
      });
    }

    // 6. Check Draft Assessments in ExamConfig if connected
    const examConfig = await this.prisma.examConfig.findUnique({
      where: { code: testConfig.configKey },
    });

    if (examConfig && examConfig.status === ConfigStatus.DRAFT) {
      throw new BadRequestException({
        code: "DRAFT_ASSESSMENT",
        message: "This assessment is in draft mode and cannot be executed.",
      });
    }

    // 7. Check Expired Attempts / Time Window
    const executionState = await this.prisma.executionState.findUnique({
      where: { testInstanceId },
    });

    const { isExpired } = this.validateTimer(testInstance, executionState);
    if (isExpired) {
      throw new BadRequestException({
        code: "EXPIRED_SESSION",
        message: "The allowed time window for this assessment has expired",
      });
    }

    // 8. Check Duplicate Attempts (concurrent ongoing sessions)
    const duplicateAttempts = await this.prisma.testInstance.findMany({
      where: {
        userId,
        testConfigId: testInstance.testConfigId,
        status: { in: ["CREATED", "IN_PROGRESS"] },
        id: { not: testInstanceId },
      },
    });

    if (duplicateAttempts.length > 0) {
      throw new ConflictException({
        code: "DUPLICATE_ATTEMPT",
        message:
          "You have another active attempt in progress for this assessment",
      });
    }

    return { isValid: true, message: "Valid runtime session" };
  }
}
