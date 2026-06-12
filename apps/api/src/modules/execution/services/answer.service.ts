// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Injectable, BadRequestException, Inject } from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";
import { PrismaService } from "../../../prisma/prisma.service";
import { ExecutionValidatorService } from "./execution-validator.service";
import { ExecutionStateService } from "./execution-state.service";
import { CandidateAnswerRepository } from "../repositories";
// eslint-disable-next-line no-restricted-imports
import { CandidateAnswerDto } from "../dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class AnswerService {
  private readonly logger = new AppLogger({ name: "AnswerService" });

  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: ExecutionValidatorService,
    private readonly stateService: ExecutionStateService,
    private readonly answerRepo: CandidateAnswerRepository,
  ) {}

  async saveAnswer(
    testInstanceId: string,
    userId: string,
    dto: CandidateAnswerDto,
  ): Promise<{ status: string }> {
    this.logger.debug("Saving candidate answer", { testInstanceId, questionId: dto.questionId });
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch test instance
      const testInstance = await this.validator.validateAssessment(testInstanceId, tx);

      // 2. Validate ownership
      this.validator.validateOwnership(testInstance, userId);

      // 3. Validate state (not submitted)
      this.validator.validateSubmissionState(testInstance);

      // 4. Load execution state
      const executionState = await this.stateService.restoreProgress(testInstanceId, tx);

      // 5. Validate timer
      const { isExpired, actualRemainingTime } = this.validator.validateTimer(
        testInstance,
        executionState,
        dto.timeSpentSeconds ? (executionState?.remainingTimeSeconds || 0) - dto.timeSpentSeconds : undefined
      );

      if (isExpired) {
        this.logger.warn("Timer expired during autosave", { testInstanceId, userId });
        return { status: "expired" };
      }

      // 6. Validate question
      this.validator.validateQuestion(testInstanceId, dto.questionId);

      // 7. Persist Answer
      const repo = this.answerRepo.withTransaction(tx);
      const existingAnswers = await repo.findAll({ testInstanceId, questionId: dto.questionId });
      const existing = existingAnswers[0];

      if (existing) {
        await repo.update(existing.id, {
          answer: dto.answer as unknown as Prisma.InputJsonValue,
          timeSpentSeconds: existing.timeSpentSeconds + (dto.timeSpentSeconds || 0),
          isMarkedForReview: dto.isMarkedForReview !== undefined ? dto.isMarkedForReview : existing.isMarkedForReview,
          savedAt: new Date(),
        });
      } else {
        await repo.create({
          testInstance: { connect: { id: testInstanceId } },
          questionId: dto.questionId,
          answer: dto.answer as unknown as Prisma.InputJsonValue,
          timeSpentSeconds: dto.timeSpentSeconds || 0,
          isMarkedForReview: dto.isMarkedForReview || false,
          savedAt: new Date(),
        });
      }

      // 8. Update Execution State
      const newRemainingTime = Math.max(0, actualRemainingTime);
      await this.stateService.saveProgress(
        testInstanceId,
        executionState?.currentQuestionIndex || 0,
        newRemainingTime,
        tx
      );

      this.logger.debug("Answer saved successfully", { testInstanceId, questionId: dto.questionId });
      return { status: "saved" };
    });
  }
}

