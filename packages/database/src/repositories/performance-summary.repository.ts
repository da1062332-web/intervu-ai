import { PrismaClient, PerformanceSummary, Prisma } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";

export interface UpsertPerformanceSummaryInput {
  userId: string;
  testsCompleted: number;
  averageScore: number;
  bestScore: number;
  lastAssessmentDate?: Date;
}

export interface UpdatePerformanceSummaryMetricsInput {
  testsCompleted: number;
  averageScore: number;
  bestScore: number;
  lastAssessmentDate?: Date;
}

export class PerformanceSummaryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertSummary(
    data: UpsertPerformanceSummaryInput,
    tx?: Prisma.TransactionClient
  ): Promise<PerformanceSummary> {
    const client = tx || this.prisma;
    return await client.performanceSummary.upsert({
      where: { userId: data.userId },
      update: {
        testsCompleted: data.testsCompleted,
        averageScore: data.averageScore,
        bestScore: data.bestScore,
        lastAssessmentDate: data.lastAssessmentDate,
      },
      create: {
        userId: data.userId,
        testsCompleted: data.testsCompleted,
        averageScore: data.averageScore,
        bestScore: data.bestScore,
        lastAssessmentDate: data.lastAssessmentDate,
      },
    });
  }

  async findByUser(
    userId: string,
    tx?: Prisma.TransactionClient
  ): Promise<PerformanceSummary | null> {
    const client = tx || this.prisma;
    return await client.performanceSummary.findUnique({
      where: { userId },
    });
  }

  async updateMetrics(
    userId: string,
    data: UpdatePerformanceSummaryMetricsInput,
    tx?: Prisma.TransactionClient
  ): Promise<PerformanceSummary> {
    const client = tx || this.prisma;
    return await client.performanceSummary.update({
      where: { userId },
      data: {
        testsCompleted: data.testsCompleted,
        averageScore: data.averageScore,
        bestScore: data.bestScore,
        lastAssessmentDate: data.lastAssessmentDate,
      },
    });
  }

  /**
   * Performs an atomic upsert with calculated aggregate metrics in a single database roundtrip.
   * Extremely optimized for batch/WAN environments.
   */
  async upsertSummaryWithCalculation(
    userId: string,
    score: number,
    date: Date,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const client = tx || this.prisma;
    const id = createId();
    await client.$executeRawUnsafe(`
      INSERT INTO "PerformanceSummary" ("id", "userId", "testsCompleted", "averageScore", "bestScore", "lastAssessmentDate", "updatedAt")
      VALUES ($1, $2, 1, $3, $3, $4, NOW())
      ON CONFLICT ("userId") DO UPDATE SET
        "testsCompleted" = "PerformanceSummary"."testsCompleted" + 1,
        "averageScore" = ROUND((("PerformanceSummary"."averageScore" * "PerformanceSummary"."testsCompleted" + EXCLUDED."averageScore") / ("PerformanceSummary"."testsCompleted" + 1))::numeric, 2),
        "bestScore" = GREATEST("PerformanceSummary"."bestScore", EXCLUDED."bestScore"),
        "lastAssessmentDate" = EXCLUDED."lastAssessmentDate",
        "updatedAt" = NOW();
    `, id, userId, score, date);
  }
}
