import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";
import { TestInstance, ExecutionState } from "@prisma/client";
import { TestInstanceRepository } from "../repositories";

@Injectable()
export class ExecutionValidatorService {
  private readonly logger = new AppLogger({ name: "ExecutionValidatorService" });

  constructor(private readonly testInstanceRepo: TestInstanceRepository) {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  async validateAssessment(testInstanceId: string, tx?: any): Promise<TestInstance> {
    const repo = tx ? this.testInstanceRepo.withTransaction(tx) : this.testInstanceRepo;
    const testInstance = await repo.findById(testInstanceId);

    if (!testInstance) {
      this.logger.warn("Validation failed: Assessment not found", { testInstanceId });
      throw new NotFoundException({
        code: "ASSESSMENT_NOT_FOUND",
        message: "Assessment not found",
      });
    }

    return testInstance;
  }

  validateOwnership(testInstance: TestInstance, userId: string): void {
    if (testInstance.userId !== userId) {
      this.logger.warn("Validation failed: Ownership check failed", { testInstanceId: testInstance.id, userId });
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "You do not own this assessment",
      });
    }
  }

  validateSubmissionState(testInstance: TestInstance): void {
    if (testInstance.status === "SUBMITTED" || testInstance.status === "COMPLETED") {
      this.logger.warn("Validation failed: Assessment already submitted", { testInstanceId: testInstance.id, status: testInstance.status });
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
    let actualRemainingTime = executionState?.remainingTimeSeconds ?? providedRemainingTime ?? 0;
    
    if (testInstance.expiresAt) {
       const timeToExpiry = Math.floor((testInstance.expiresAt.getTime() - Date.now()) / 1000);
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

  validateQuestion(
    testInstanceId: string,
    questionId: string,
  ): void {
    if (!questionId) {
       this.logger.warn("Validation failed: Invalid question ID", { testInstanceId, questionId });
       throw new BadRequestException({
         code: "INVALID_QUESTION",
         message: "Question ID is invalid",
       });
    }
  }
}
