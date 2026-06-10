import { PrismaClient, CandidateAnswer } from "@prisma/client";

export class CandidateAnswerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async saveAnswer(data: {
    testInstanceId: string;
    questionId: string;
    answer: any;
    timeSpentSeconds?: number;
    isMarkedForReview?: boolean;
  }): Promise<CandidateAnswer> {
    return await this.prisma.candidateAnswer.upsert({
      where: {
        testInstanceId_questionId: {
          testInstanceId: data.testInstanceId,
          questionId: data.questionId,
        },
      },
      update: {
        answer: data.answer,
        timeSpentSeconds: data.timeSpentSeconds,
        isMarkedForReview: data.isMarkedForReview,
        savedAt: new Date(),
      },
      create: {
        testInstanceId: data.testInstanceId,
        questionId: data.questionId,
        answer: data.answer,
        timeSpentSeconds: data.timeSpentSeconds ?? 0,
        isMarkedForReview: data.isMarkedForReview ?? false,
      },
    });
  }

  async findAnswer(testInstanceId: string, questionId: string): Promise<CandidateAnswer | null> {
    return await this.prisma.candidateAnswer.findUnique({
      where: {
        testInstanceId_questionId: {
          testInstanceId,
          questionId,
        },
      },
    });
  }

  async findByInstance(testInstanceId: string): Promise<CandidateAnswer[]> {
    return await this.prisma.candidateAnswer.findMany({
      where: { testInstanceId },
    });
  }

  async countAnswered(testInstanceId: string): Promise<number> {
    return await this.prisma.candidateAnswer.count({
      where: { testInstanceId },
    });
  }
}
