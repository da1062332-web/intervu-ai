import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ResultGeneratorService } from "./result-generator.service";
import { ResultStorageService } from "./result-storage.service";
import { CandidateRankingService } from "../ranking/candidate-ranking.service";
import { PercentileService } from "../ranking/percentile.service";
import { AiInsightService } from "../insights/ai-insight.service";
import { ImprovementPlanService } from "../recommendations/improvement-plan.service";

@Injectable()
export class ReEvaluationService {
  private readonly logger = new Logger("ReEvaluationService");

  constructor(
    private readonly prisma: PrismaService,
    private readonly resultGenerator: ResultGeneratorService,
    private readonly resultStorage: ResultStorageService,
    private readonly rankingService: CandidateRankingService,
    private readonly percentileService: PercentileService,
    private readonly aiInsightService: AiInsightService,
    private readonly improvementPlanService: ImprovementPlanService,
  ) {}

  /**
   * Triggers reprocessing for a specific test attempt.
   * Critical path: generate result + save to DB.
   * Post-processing (rankings, insights, plans, TCS) runs asynchronously after save.
   */
  async reprocess(attemptId: string, triggeredBy = "MANUAL"): Promise<any> {
    const startTime = Date.now();
    this.logger.log(
      `Reprocessing evaluation for attempt: ${attemptId} triggered by ${triggeredBy}`,
    );

    try {
      // 1. Fetch attempt and answers
      const attempt = await this.prisma.testInstance.findUnique({
        where: { id: attemptId },
        include: { candidateAnswers: true },
      });

      if (!attempt) {
        throw new NotFoundException(`Attempt ${attemptId} not found`);
      }

      // 2. Map candidate answers to ExecutionResultDto
      const executionResult = {
        executionId: `reproc_${attemptId}_${Date.now()}`,
        testId: attemptId,
        status: "submitted",
        submittedAt: attempt.submittedAt || new Date(),
        answers: attempt.candidateAnswers.map((a) => ({
          questionId: a.questionId,
          answer: String(a.answer),
          timeSpentSeconds: a.timeSpentSeconds || 0,
        })),
      };

      // 3. Generate candidate result DTO (critical path)
      const resultDto = await this.resultGenerator.generateResult(executionResult);

      // 4. Save base results — critical path ends here
      const durationMs = Date.now() - startTime;
      await this.resultStorage.saveResult(resultDto, durationMs);

      // 5. Fire-and-forget: run all post-processing tasks in parallel, non-blocking
      this.runPostProcessingAsync(attemptId, resultDto, triggeredBy).catch((err) =>
        this.logger.warn("Post-processing error (non-blocking, will not affect result)", {
          attemptId,
          error: err instanceof Error ? err.message : String(err),
        }),
      );

      // Return immediately without waiting for post-processing
      return {
        success: true,
        attemptId,
        score: resultDto.score,
        percentage: resultDto.percentage,
        passed: resultDto.passed ?? false,
        objectiveScore: resultDto.objectiveScore ?? 0,
        codingScore: resultDto.codingScore ?? 0,
        maxMarks: resultDto.maxMarks ?? 0,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Reprocessing failed for attempt ${attemptId}: ${errorMsg}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Log failure
      try {
        await this.prisma.evaluationReprocessLog.create({
          data: {
            attemptId,
            status: "FAILED",
            error: errorMsg,
            triggeredBy,
            createdAt: new Date(),
          },
        });
      } catch (logErr) {
        this.logger.error("Failed to write reprocess failure log", logErr);
      }

      throw error;
    }
  }

  /**
   * Runs all post-processing tasks in parallel after the base result is saved.
   * This runs fire-and-forget — errors here do NOT affect the candidate's result.
   */
  private async runPostProcessingAsync(
    attemptId: string,
    resultDto: any,
    triggeredBy: string,
  ): Promise<void> {
    this.logger.log(`Starting async post-processing for attempt: ${attemptId}`);

    const tasks = await Promise.allSettled([
      // Rankings
      (async () => {
        const rankingDto = await this.rankingService.calculateRanking(resultDto);
        await this.prisma.candidateRanking.upsert({
          where: { attemptId },
          update: {
            assessmentRank: rankingDto.assessment.rank,
            orgRank: rankingDto.organization.rank,
            batchRank: rankingDto.batch.rank,
            totalAssessmentCandidates: rankingDto.assessment.totalCandidates,
            totalOrgCandidates: rankingDto.organization.totalCandidates,
            totalBatchCandidates: rankingDto.batch.totalCandidates,
            percentile: rankingDto.percentile,
            createdAt: new Date(),
          },
          create: {
            attemptId,
            assessmentRank: rankingDto.assessment.rank,
            orgRank: rankingDto.organization.rank,
            batchRank: rankingDto.batch.rank,
            totalAssessmentCandidates: rankingDto.assessment.totalCandidates,
            totalOrgCandidates: rankingDto.organization.totalCandidates,
            totalBatchCandidates: rankingDto.batch.totalCandidates,
            percentile: rankingDto.percentile,
            createdAt: new Date(),
          },
        });
        await this.percentileService.calculateAndStorePercentile(
          attemptId,
          rankingDto.percentile,
        );
      })(),
      // AI Insights
      this.aiInsightService.generateInsights(attemptId),
      // Improvement Plans
      this.improvementPlanService.generatePlans(attemptId),
    ]);

    // Log individual post-processing results
    for (const [idx, result] of tasks.entries()) {
      const taskNames = ["rankings+percentile", "ai-insights", "improvement-plans"];
      if (result.status === "rejected") {
        this.logger.warn(`Post-processing task [${taskNames[idx]}] failed`, {
          attemptId,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
      }
    }

    // Log success in reprocess log table
    await this.prisma.evaluationReprocessLog.create({
      data: {
        attemptId,
        status: "SUCCESS",
        triggeredBy,
        createdAt: new Date(),
      },
    });

    this.logger.log(`Async post-processing completed for attempt: ${attemptId}`);
  }


  /**
   * Aggregates platform-wide evaluation metrics for admin dashboard.
   */
  async getPlatformAnalytics(): Promise<any> {
    // 1. Calculate Average Score
    const scoreAgg = await this.prisma.candidateResult.aggregate({
      _avg: { percentage: true },
      _count: { id: true },
    });
    const averageScore = scoreAgg._avg.percentage || 0;

    // 2. Fetch completion and attempt rate averages in a single DB aggregate
    const analyticsAgg = await this.prisma.evaluationAnalytics.aggregate({
      _avg: {
        completionRate: true,
        attemptRate: true,
      },
      _count: { id: true },
    });
    const avgCompletionRate = analyticsAgg._avg.completionRate || 0;
    const avgAttemptRate = analyticsAgg._avg.attemptRate || 0;

    // 3. Fetch topic accuracy select-only fields (avoiding loading full tables)
    const analyticsAccs = await this.prisma.evaluationAnalytics.findMany({
      select: {
        topicAccuracy: true,
      },
    });

    const topicAccuracySums: Record<string, { sum: number; count: number }> =
      {};
    let totalAccuracySum = 0;
    let totalAttemptsCount = 0;

    analyticsAccs.forEach((ann) => {
      const topicAcc = (ann.topicAccuracy as Record<string, number>) || {};
      let accSum = 0;
      let accCount = 0;
      Object.entries(topicAcc).forEach(([topic, acc]) => {
        accSum += acc;
        accCount++;
        if (!topicAccuracySums[topic]) {
          topicAccuracySums[topic] = { sum: 0, count: 0 };
        }
        topicAccuracySums[topic].sum += acc;
        topicAccuracySums[topic].count++;
      });

      if (accCount > 0) {
        totalAccuracySum += accSum / accCount;
        totalAttemptsCount++;
      }
    });

    const averageAccuracy =
      totalAttemptsCount > 0
        ? totalAccuracySum / totalAttemptsCount
        : averageScore;

    // Sort topics to find top and weakest
    const topicsList = Object.entries(topicAccuracySums).map(
      ([topicName, data]) => ({
        topicName,
        averageAccuracy: Math.round(data.sum / data.count),
      }),
    );

    const sortedTopics = [...topicsList].sort(
      (a, b) => b.averageAccuracy - a.averageAccuracy,
    );
    const topTopics = sortedTopics.slice(0, 3);
    const weakestTopics = [...sortedTopics].reverse().slice(0, 3);

    // 4. Calculate Assessment Performance Trends using highly optimized PostgreSQL aggregation
    const trends: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as "date",
        ROUND(AVG(percentage))::integer as "averageScore",
        COUNT(*)::integer as "totalAttempts"
      FROM candidate_results
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY "date" ASC
    `);

    return {
      averageScore: Math.round(averageScore),
      averageAccuracy: Math.round(averageAccuracy),
      topTopics,
      weakestTopics,
      completionRates: {
        completionRate: Math.round(avgCompletionRate),
        attemptRate: Math.round(avgAttemptRate),
      },
      assessmentPerformanceTrends: trends,
    };
  }
}
