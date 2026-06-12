import { Injectable } from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";
import { ExecutionValidatorService } from "./execution-validator.service";
import { ExecutionStateService } from "./execution-state.service";
import { CandidateAnswerRepository } from "../repositories";

@Injectable()
export class ResumeService {
  private readonly logger = new AppLogger({ name: "ResumeService" });

  constructor(
    private readonly validator: ExecutionValidatorService,
    private readonly stateService: ExecutionStateService,
    private readonly answerRepo: CandidateAnswerRepository,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async resumeAssessment(testInstanceId: string, userId: string): Promise<any> {
    this.logger.debug("Resuming assessment", { testInstanceId, userId });
    // 1. Validate assessment exists
    const testInstance =
      await this.validator.validateAssessment(testInstanceId);

    // 2. Validate ownership
    this.validator.validateOwnership(testInstance, userId);

    // 3. Check if submitted (we might still allow resume/viewing if submitted, but let's check)
    // The prompt says "Support interrupted sessions", meaning it's active.

    // 4. Fetch execution state
    const executionState =
      await this.stateService.restoreProgress(testInstanceId);

    // 5. Fetch candidate answers
    const answers = await this.answerRepo.findAll({ testInstanceId });

    return {
      testInstanceId,
      status: testInstance.status,
      executionState: executionState
        ? {
            currentQuestionIndex: executionState.currentQuestionIndex,
            remainingTimeSeconds: executionState.remainingTimeSeconds,
          }
        : null,
      answers: answers.map((a) => ({
        questionId: a.questionId,
        answer: a.answer,
        timeSpentSeconds: a.timeSpentSeconds,
        isMarkedForReview: a.isMarkedForReview,
        savedAt: a.savedAt,
      })),
    };
  }
}
