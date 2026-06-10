import { PrismaClient } from "@prisma/client";

export class ExecutionPersistenceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Extremely optimized flat-array transaction to persist answer and state
   * in exactly 1 network round-trip. Crucial for autosave SLA.
   */
  async saveAnswerAndState(
    answerData: {
      testInstanceId: string;
      questionId: string;
      answer: any;
      timeSpentSeconds?: number;
      isMarkedForReview?: boolean;
    },
    stateData: {
      testInstanceId: string;
      currentQuestionIndex: number;
      remainingTimeSeconds: number;
    }
  ): Promise<void> {
    const queries = [
      this.prisma.candidateAnswer.upsert({
        where: {
          testInstanceId_questionId: {
            testInstanceId: answerData.testInstanceId,
            questionId: answerData.questionId,
          },
        },
        update: {
          answer: answerData.answer,
          timeSpentSeconds: answerData.timeSpentSeconds,
          isMarkedForReview: answerData.isMarkedForReview,
          savedAt: new Date(),
        },
        create: {
          testInstanceId: answerData.testInstanceId,
          questionId: answerData.questionId,
          answer: answerData.answer,
          timeSpentSeconds: answerData.timeSpentSeconds ?? 0,
          isMarkedForReview: answerData.isMarkedForReview ?? false,
        },
      }),
      this.prisma.executionState.upsert({
        where: { testInstanceId: stateData.testInstanceId },
        update: {
          currentQuestionIndex: stateData.currentQuestionIndex,
          remainingTimeSeconds: stateData.remainingTimeSeconds,
          lastActivityAt: new Date(),
        },
        create: {
          testInstanceId: stateData.testInstanceId,
          currentQuestionIndex: stateData.currentQuestionIndex,
          remainingTimeSeconds: stateData.remainingTimeSeconds,
        },
      }),
    ];

    await this.prisma.$transaction(queries);
  }

  /**
   * Batch upserts multiple answers (e.g. offline sync)
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
    const queries = answers.map((ans) =>
      this.prisma.candidateAnswer.upsert({
        where: {
          testInstanceId_questionId: {
            testInstanceId,
            questionId: ans.questionId,
          },
        },
        update: {
          answer: ans.answer,
          timeSpentSeconds: ans.timeSpentSeconds,
          isMarkedForReview: ans.isMarkedForReview,
          savedAt: new Date(),
        },
        create: {
          testInstanceId,
          questionId: ans.questionId,
          answer: ans.answer,
          timeSpentSeconds: ans.timeSpentSeconds ?? 0,
          isMarkedForReview: ans.isMarkedForReview ?? false,
        },
      })
    );

    await this.prisma.$transaction(queries);
  }
}
