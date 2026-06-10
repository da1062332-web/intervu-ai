import {
  ExecutionPersistenceRepository,
  SubmissionRepository,
  SubmissionStatus,
} from "@intervu/database";

export class AnswerPersistenceService {
  constructor(
    private readonly executionPersistenceRepo: ExecutionPersistenceRepository,
    private readonly submissionRepo: SubmissionRepository
  ) {}

  /**
   * Autosaves a single candidate answer and their execution state (timer/index).
   * Enforces the Submission Lock rule.
   */
  async saveCandidateAnswer(
    testInstanceId: string,
    questionId: string,
    answer: any,
    currentQuestionIndex: number,
    remainingTimeSeconds: number,
    timeSpentSeconds?: number,
    isMarkedForReview?: boolean
  ): Promise<void> {
    // 1. Validate Dependencies (Submission Lock)
    const submission = await this.submissionRepo.findByInstance(testInstanceId);
    const currentStatus = submission?.status ?? SubmissionStatus.PENDING;

    // 2. Core Logic Lock Enforcement
    if (
      currentStatus === SubmissionStatus.SUBMITTED ||
      currentStatus === SubmissionStatus.EVALUATED
    ) {
      throw new Error("ANSWER_MODIFICATION_NOT_ALLOWED");
    }

    // 3. Format Response (Save to DB via Flat Transaction)
    await this.executionPersistenceRepo.saveAnswerAndState(
      {
        testInstanceId,
        questionId,
        answer,
        timeSpentSeconds,
        isMarkedForReview,
      },
      {
        testInstanceId,
        currentQuestionIndex,
        remainingTimeSeconds,
      }
    );
  }

  /**
   * Batch processes multiple answers (useful for offline recovery)
   */
  async saveManyAnswers(
    testInstanceId: string,
    answers: Array<{
      questionId: string;
      answer: any;
      timeSpentSeconds?: number;
      isMarkedForReview?: boolean;
    }>
  ): Promise<void> {
    const submission = await this.submissionRepo.findByInstance(testInstanceId);
    const currentStatus = submission?.status ?? SubmissionStatus.PENDING;

    if (
      currentStatus === SubmissionStatus.SUBMITTED ||
      currentStatus === SubmissionStatus.EVALUATED
    ) {
      throw new Error("ANSWER_MODIFICATION_NOT_ALLOWED");
    }

    await this.executionPersistenceRepo.saveManyAnswers(testInstanceId, answers);
  }
}
