import { PrismaClient } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

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
    },
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
   * Optimized with Raw SQL for <1.0s latency over WAN.
   */
  async saveManyAnswers(
    testInstanceId: string,
    answers: Array<{
      questionId: string;
      answer: any;
      timeSpentSeconds?: number;
      isMarkedForReview?: boolean;
    }>,
  ): Promise<void> {
    if (answers.length === 0) return;

    // Build the parameterized value strings and flat values array
    const values: any[] = [];
    const placeholders = answers
      .map((ans, index) => {
        const offset = index * 8;
        const now = new Date();
        values.push(
          createId(), // Generate standard cuid for the id field
          ans.questionId,
          testInstanceId,
          ans.answer, // Prisma automatically serializes objects for parameterized jsonb queries in raw sql
          ans.timeSpentSeconds ?? 0,
          ans.isMarkedForReview ?? false,
          now, // savedAt timestamp
          now, // updatedAt timestamp
        );
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}::jsonb, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`;
      })
      .join(", ");

    // Use $executeRawUnsafe to pass dynamic parameterized array to prevent SQL injection while maintaining raw speed
    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO "CandidateAnswer" ("id", "questionId", "testInstanceId", "answer", "timeSpentSeconds", "isMarkedForReview", "savedAt", "updatedAt")
      VALUES ${placeholders}
      ON CONFLICT ("testInstanceId", "questionId") DO UPDATE SET
        "answer" = EXCLUDED."answer",
        "timeSpentSeconds" = EXCLUDED."timeSpentSeconds",
        "isMarkedForReview" = EXCLUDED."isMarkedForReview",
        "savedAt" = EXCLUDED."savedAt",
        "updatedAt" = EXCLUDED."updatedAt";
    `,
      ...values,
    );
  }
}
