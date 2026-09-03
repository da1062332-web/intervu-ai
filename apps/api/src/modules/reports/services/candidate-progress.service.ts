import { Injectable, Optional } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import { AppLogger } from "@intervu-ai/shared-logger";
import { ReportAuditService } from "./report-audit.service";
import { EntitlementService } from "../../billing/services/entitlement.service";

@Injectable()
export class CandidateProgressService {
  private readonly logger = new AppLogger({ name: "CandidateProgressService" });
  private readonly CACHE_PREFIX = "progress:candidate:v8";

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: RedisCacheService,
    private readonly auditService: ReportAuditService,
    @Optional() private readonly entitlementService?: EntitlementService,
  ) {}

  async getCandidateProgress(userId: string): Promise<any> {
    this.logger.debug("Retrieving candidate progress analytics", { userId });

    if (this.entitlementService) {
      let entitlements = null;
      try {
        entitlements = await this.entitlementService.getUserEntitlements(userId);
      } catch {}

      if (!entitlements || !entitlements.hasActivePlan) {
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
            peerAverageScore: 0,
            topPercentileScore: 0,
            totalAssessments: 0,
            completionRate: 0,
          },
          isLocked: true,
        };
      }
    }

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

    // BUG-006 + BUG-007: Fetch all necessary data in a single query including
    // evaluationAnalytics (which has topicAccuracy + difficultyAccuracy as JSON columns).
    // This eliminates the N+1 sequential getResultDetails() calls from the old code.
    const attempts = await this.prisma.testInstance.findMany({
      where: {
        userId,
        status: { in: ["COMPLETED", "SUBMITTED"] },
      },
      orderBy: { createdAt: "asc" },
      include: {
        evaluationResult: true,
        evaluationAnalytics: true,
        testConfig: true,
        examConfig: true,
      },
    });

    const report = await this.compileProgressReport(attempts);

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

  private async compileProgressReport(attempts: any[]): Promise<any> {
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

    // BUG-006 fix: Fetch topic/concept name maps ONCE (not per attempt)
    const [allTopics, allConcepts] = await Promise.all([
      this.prisma.topic.findMany({
        select: { id: true, name: true, code: true },
      }),
      this.prisma.concept.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          topic: { select: { name: true } },
        },
      }),
    ]);

    const topicNameMap = new Map<string, string>();
    allTopics.forEach((t) => {
      topicNameMap.set(t.id, t.name);
      if (t.code) topicNameMap.set(t.code, t.name);
    });
    allConcepts.forEach((c) => {
      const parentOrName = c.topic?.name || c.name;
      topicNameMap.set(c.id, parentOrName);
      if (c.code) topicNameMap.set(c.code, parentOrName);
    });

    const trend: { date: string; score: number; label: string }[] = [];
    const scores: number[] = [];

    // BUG-007 fix: Aggregate topic/difficulty accuracy directly from evaluationAnalytics
    // (JSON columns already on the DB row — no extra queries needed).
    const topicAgg: Record<string, { sum: number; count: number }> = {};
    const diffAgg = {
      easy: { attempted: 0, correct: 0 },
      medium: { attempted: 0, correct: 0 },
      hard: { attempted: 0, correct: 0 },
    };

    for (const a of attempts) {
      // Build score trend from evaluationResult
      if (a.evaluationResult) {
        trend.push({
          date: (a.evaluationResult.createdAt || a.createdAt).toISOString(),
          score: a.evaluationResult.overallScore ?? 0,
          label:
            a.testConfig?.displayName || a.examConfig?.name || "Assessment",
        });
        scores.push(a.evaluationResult.overallScore ?? 0);
      }

      // BUG-007: Read topic and difficulty accuracy from the evaluationAnalytics row
      // directly — no extra DB call or service invocation required.
      const analytics = a.evaluationAnalytics as any;
      if (!analytics) continue;

      const rawTopicAccuracy = analytics.topicAccuracy as Record<
        string,
        number
      > | null;
      if (rawTopicAccuracy && typeof rawTopicAccuracy === "object") {
        for (const [topicKey, accuracy] of Object.entries(rawTopicAccuracy)) {
          const cleanName = topicNameMap.get(topicKey) || topicKey;
          const isUuidOrId =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              cleanName.trim(),
            ) || /^c[a-z0-9]{24}$/i.test(cleanName.trim());
          if (isUuidOrId) continue;

          if (!topicAgg[cleanName]) topicAgg[cleanName] = { sum: 0, count: 0 };
          topicAgg[cleanName].sum += Number(accuracy) || 0;
          topicAgg[cleanName].count += 1;
        }
      }

      const rawDifficultyAccuracy = analytics.difficultyAccuracy as Record<
        string,
        number
      > | null;
      if (rawDifficultyAccuracy && typeof rawDifficultyAccuracy === "object") {
        for (const [diff, accuracy] of Object.entries(rawDifficultyAccuracy)) {
          const key = diff.toLowerCase() as keyof typeof diffAgg;
          if (diffAgg[key]) {
            // Accuracy is a percentage (0-100). Map back to attempted/correct counts
            // by treating each assessment as contributing 10 "virtual" questions.
            const virtualTotal = 10;
            const virtualCorrect = Math.round(
              (Number(accuracy) / 100) * virtualTotal,
            );
            diffAgg[key].attempted += virtualTotal;
            diffAgg[key].correct += virtualCorrect;
          }
        }
      }
    }

    // Build skills array from aggregated topic data
    const skills = Object.entries(topicAgg)
      .map(([topic, { sum, count }]) => ({
        topic,
        score: count > 0 ? Math.round(sum / count) : 0,
      }))
      .sort((a, b) => b.score - a.score);

    const averageScore =
      scores.length > 0
        ? Math.round(scores.reduce((acc, s) => acc + s, 0) / scores.length)
        : 0;
    const topPercentileScore = scores.length > 0 ? Math.max(...scores) : 0;
    // All fetched attempts are COMPLETED/SUBMITTED so completion rate is 100%
    const completionRate = totalAssessments > 0 ? 100 : 0;

    return {
      trend,
      skills,
      difficulty: diffAgg,
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
