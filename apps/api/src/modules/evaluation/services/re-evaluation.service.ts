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
   * Triggers reprocessing for a specific test attempt, regenerating all scores, ranks, benchmarks, insights, and study plans.
   */
  async reprocess(attemptId: string, triggeredBy = "MANUAL"): Promise<any> {
    const startTime = Date.now();
    this.logger.log(`Reprocessing evaluation for attempt: ${attemptId} triggered by ${triggeredBy}`);

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

      // 3. Generate candidate result DTO
      const resultDto = await this.resultGenerator.generateResult(executionResult);

      // 4. Save base results (transactional upsert of CandidateResult, EvaluationAnalytics)
      const durationMs = Date.now() - startTime;
      await this.resultStorage.saveResult(resultDto, durationMs);

      // 5. Calculate and save rankings
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

      // 6. Calculate and store percentile bands
      await this.percentileService.calculateAndStorePercentile(attemptId, rankingDto.percentile);

      // 7. Generate AI Insights and Study Plans
      await this.aiInsightService.generateInsights(attemptId);
      await this.improvementPlanService.generatePlans(attemptId);

      // 8. Log success in reprocess log table
      await this.prisma.evaluationReprocessLog.create({
        data: {
          attemptId,
          status: "SUCCESS",
          triggeredBy,
          createdAt: new Date(),
        },
      });

      return {
        success: true,
        attemptId,
        score: resultDto.score,
        percentage: resultDto.percentage,
        ranking: rankingDto,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Reprocessing failed for attempt ${attemptId}: ${errorMsg}`, error instanceof Error ? error.stack : undefined);

      // Log failure in reprocess log table
      await this.prisma.evaluationReprocessLog.create({
        data: {
          attemptId,
          status: "FAILED",
          error: errorMsg,
          triggeredBy,
          createdAt: new Date(),
        },
      });

      throw error;
    }
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

    // 2. Fetch all EvaluationAnalytics records
    const analytics = await this.prisma.evaluationAnalytics.findMany();

    // 3. Average Accuracy, completion rates
    let totalAccuracySum = 0;
    let totalCompletionRateSum = 0;
    let totalAttemptRateSum = 0;
    const topicAccuracySums: Record<string, { sum: number; count: number }> = {};

    analytics.forEach((ann) => {
      // completion and attempt rates
      totalCompletionRateSum += ann.completionRate;
      totalAttemptRateSum += ann.attemptRate;

      // topic accuracy
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
      }
    });

    const averageAccuracy = analytics.length > 0 ? totalAccuracySum / analytics.length : averageScore;
    const avgCompletionRate = analytics.length > 0 ? totalCompletionRateSum / analytics.length : 0;
    const avgAttemptRate = analytics.length > 0 ? totalAttemptRateSum / analytics.length : 0;

    // Sort topics to find top and weakest
    const topicsList = Object.entries(topicAccuracySums).map(([topicName, data]) => ({
      topicName,
      averageAccuracy: Math.round(data.sum / data.count),
    }));

    const sortedTopics = [...topicsList].sort((a, b) => b.averageAccuracy - a.averageAccuracy);
    const topTopics = sortedTopics.slice(0, 3);
    const weakestTopics = [...sortedTopics].reverse().slice(0, 3);

    // 4. Calculate Assessment Performance Trends (daily groups)
    const results = await this.prisma.candidateResult.findMany({
      select: { percentage: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const dailyGroups: Record<string, { sum: number; count: number }> = {};
    results.forEach((res) => {
      const dateStr = res.createdAt.toISOString().split("T")[0]; // YYYY-MM-DD
      if (!dailyGroups[dateStr]) {
        dailyGroups[dateStr] = { sum: 0, count: 0 };
      }
      dailyGroups[dateStr].sum += res.percentage;
      dailyGroups[dateStr].count++;
    });

    const assessmentPerformanceTrends = Object.entries(dailyGroups).map(([date, data]) => ({
      date,
      averageScore: Math.round(data.sum / data.count),
      totalAttempts: data.count,
    }));

    return {
      averageScore: Math.round(averageScore),
      averageAccuracy: Math.round(averageAccuracy),
      topTopics,
      weakestTopics,
      completionRates: {
        completionRate: Math.round(avgCompletionRate),
        attemptRate: Math.round(avgAttemptRate),
      },
      assessmentPerformanceTrends,
    };
  }
}
