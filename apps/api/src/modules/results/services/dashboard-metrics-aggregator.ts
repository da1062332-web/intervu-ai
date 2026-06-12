import { PerformanceSummaryRepository } from "@intervu-ai/database";
import { Prisma } from "@prisma/client";

export class DashboardMetricsAggregator {
  constructor(
    private readonly performanceSummaryRepo: PerformanceSummaryRepository,
  ) {}

  /**
   * Aggregates stats and updates user performance summary.
   * Runs strictly inside the transaction context `tx` and uses the repository.
   * Optimized with single-roundtrip SQL calculation.
   */
  async aggregateAndUpsert(
    userId: string,
    newScore: number,
    date: Date,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await this.performanceSummaryRepo.upsertSummaryWithCalculation(
      userId,
      newScore,
      date,
      tx,
    );
  }
}
