import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import { AppLogger } from "@intervu-ai/shared-logger";
import { ReportAuditService } from "./report-audit.service";

@Injectable()
export class CandidateProgressService {
  private readonly logger = new AppLogger({ name: "CandidateProgressService" });
  private readonly CACHE_PREFIX = "progress:candidate";

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: RedisCacheService,
    private readonly auditService: ReportAuditService,
  ) {}

  async getCandidateProgress(userId: string): Promise<any> {
    this.logger.debug("Retrieving candidate progress analytics", { userId });

    const cacheKey = `${userId}`;
    const cachedData = await this.cacheService.get<any>(cacheKey, {
      prefix: this.CACHE_PREFIX,
    });
    if (cachedData) {
      this.logger.debug("Progress analytics cache hit", { userId });
      await this.auditService.logProgressViewed(userId);
      return cachedData;
    }

    this.logger.debug("Progress cache miss, performing database aggregation", {
      userId,
    });

    const attempts = await this.prisma.testInstance.findMany({
      where: { userId, status: 'COMPLETED' },
      orderBy: { createdAt: "asc" },
      include: {
        candidateResult: true,
        evaluationAnalytics: true,
        testConfig: true,
        examConfig: true
      }
    });

    const report = this.compileProgressReport(attempts);

    await this.cacheService.set(cacheKey, report, {
      prefix: this.CACHE_PREFIX,
      ttl: 600,
    });

    await this.auditService.logProgressViewed(userId);

    return report;
  }

  async invalidateCache(userId: string): Promise<void> {
    this.logger.debug("Invalidating progress cache", { userId });
    await this.cacheService.delete(`${userId}`, { prefix: this.CACHE_PREFIX });
  }

  private compileProgressReport(attempts: any[]): any {
    const totalAssessments = attempts.length;
    if (totalAssessments === 0) {
      return {
        trend: [],
        skills: [],
        difficulty: {
          easy: { attempted: 0, correct: 0 },
          medium: { attempted: 0, correct: 0 },
          hard: { attempted: 0, correct: 0 },
        },
        overview: {
          averageScore: 0,
          topPercentileScore: 0,
          totalAssessments: 0,
          completionRate: 0,
        },
      };
    }

    // Trend
    const trend = attempts
      .filter((a) => a.candidateResult)
      .map((a) => ({
        date: a.candidateResult.createdAt,
        score: a.candidateResult.percentage,
        label: a.testConfig?.displayName || a.examConfig?.name || "Assessment",
      }));

    // Aggregate Topics & Difficulty from EvaluationAnalytics
    const topicAgg: Record<string, { sum: number; count: number }> = {};
    const diffAgg = {
      easy: { count: 0, sum: 0 },
      medium: { count: 0, sum: 0 },
      hard: { count: 0, sum: 0 },
    };

    let totalCompletionRate = 0;
    let analyticsCount = 0;

    attempts.forEach((a) => {
      const analytics = a.evaluationAnalytics;
      if (analytics) {
        analyticsCount++;
        totalCompletionRate += analytics.completionRate || 100;

        if (analytics.topicAccuracy && typeof analytics.topicAccuracy === "object") {
          for (const [topic, acc] of Object.entries(analytics.topicAccuracy)) {
            if (!topicAgg[topic]) topicAgg[topic] = { sum: 0, count: 0 };
            topicAgg[topic].sum += acc as number;
            topicAgg[topic].count += 1;
          }
        }

        if (analytics.difficultyAccuracy && typeof analytics.difficultyAccuracy === "object") {
          for (const [diff, acc] of Object.entries(analytics.difficultyAccuracy)) {
            const level = diff.toLowerCase() as keyof typeof diffAgg;
            if (diffAgg[level]) {
              diffAgg[level].sum += acc as number;
              diffAgg[level].count += 1;
            }
          }
        }
      }
    });

    const skills = Object.keys(topicAgg).map((topic) => ({
      topic,
      score: Math.round(topicAgg[topic].sum / topicAgg[topic].count),
    }));

    const difficulty = {
      easy: {
        attempted: diffAgg.easy.count > 0 ? 10 : 0, 
        correct: diffAgg.easy.count > 0 ? Math.round((diffAgg.easy.sum / diffAgg.easy.count / 100) * 10) : 0
      },
      medium: {
        attempted: diffAgg.medium.count > 0 ? 10 : 0,
        correct: diffAgg.medium.count > 0 ? Math.round((diffAgg.medium.sum / diffAgg.medium.count / 100) * 10) : 0
      },
      hard: {
        attempted: diffAgg.hard.count > 0 ? 10 : 0,
        correct: diffAgg.hard.count > 0 ? Math.round((diffAgg.hard.sum / diffAgg.hard.count / 100) * 10) : 0
      },
    };

    // Overview
    const results = attempts.map(a => a.candidateResult?.percentage || 0);
    const averageScore = Math.round(results.reduce((sum, score) => sum + score, 0) / (results.length || 1));
    const topPercentileScore = Math.max(...results, 0);

    const completionRate = analyticsCount > 0 ? Math.round(totalCompletionRate / analyticsCount) : 100;

    return {
      trend,
      skills,
      difficulty,
      overview: {
        averageScore,
        topPercentileScore,
        totalAssessments,
        completionRate,
      },
      bestScore: topPercentileScore,
    };
  }
}
