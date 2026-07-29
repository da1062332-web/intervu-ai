import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import { AppLogger } from "@intervu-ai/shared-logger";
import { ReportAuditService } from "./report-audit.service";
import { ResultsService } from "../../results/services/results.service";

@Injectable()
export class CandidateProgressService {
  private readonly logger = new AppLogger({ name: "CandidateProgressService" });
  private readonly CACHE_PREFIX = "progress:candidate:v5";

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: RedisCacheService,
    private readonly auditService: ReportAuditService,
    private readonly resultsService: ResultsService,
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
      where: { 
        userId, 
        status: { in: ['COMPLETED', 'SUBMITTED'] } 
      },
      orderBy: { createdAt: "asc" },
      include: {
        evaluationResult: true,
        testConfig: true,
        examConfig: true
      }
    });

    const report = await this.compileProgressReport(userId, attempts);

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

  private async compileProgressReport(userId: string, attempts: any[]): Promise<any> {
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

    const trend = [];
    const topicAgg: Record<string, { sum: number; count: number }> = {};
    const diffAgg = {
      easy: { count: 0, sum: 0 },
      medium: { count: 0, sum: 0 },
      hard: { count: 0, sum: 0 },
    };

    let totalCompletionRate = 0;
    const results = [];

    for (const a of attempts) {
      if (a.evaluationResult) {
        trend.push({
          date: a.evaluationResult.createdAt || a.createdAt,
          score: a.evaluationResult.overallScore,
          label: a.testConfig?.displayName || a.examConfig?.name || "Assessment",
        });
        results.push(a.evaluationResult.overallScore);
      }

      try {
        const details = await this.resultsService.getResultDetails(userId, a.id);
        
        totalCompletionRate += 100; // Assuming COMPLETED means 100% for now

        if (details.topicScores) {
          details.topicScores.forEach((t: any) => {
            const topic = t.topic || 'General';
            if (!topicAgg[topic]) topicAgg[topic] = { sum: 0, count: 0 };
            topicAgg[topic].sum += t.score;
            topicAgg[topic].count += 1;
          });
        }

        if (details.difficultyScores) {
          details.difficultyScores.forEach((d: any) => {
            const diff = (d.difficulty || '').toLowerCase() as keyof typeof diffAgg;
            if (diffAgg[diff]) {
              diffAgg[diff].sum += d.score;
              diffAgg[diff].count += 1;
            }
          });
        }
      } catch (err) {
        this.logger.error(`Failed to get details for attempt ${a.id}`, err);
      }
    }

    const allTopics = await this.prisma.topic.findMany({ select: { id: true, name: true, code: true } });
    const allConcepts = await this.prisma.concept.findMany({
      select: { id: true, name: true, code: true, topic: { select: { name: true } } },
    });
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

    const mergedSkills: Record<string, { sum: number; count: number }> = {};
    Object.keys(topicAgg).forEach((topicKey) => {
      const cleanName = topicNameMap.get(topicKey) || topicKey;
      if (!mergedSkills[cleanName]) {
        mergedSkills[cleanName] = { sum: 0, count: 0 };
      }
      mergedSkills[cleanName].sum += topicAgg[topicKey].sum;
      mergedSkills[cleanName].count += topicAgg[topicKey].count;
    });

    const skills = Object.keys(mergedSkills).map((topic) => ({
      topic,
      score: Math.round(mergedSkills[topic].sum / mergedSkills[topic].count),
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

    const averageScore = results.length > 0 ? Math.round(results.reduce((sum, score) => sum + score, 0) / results.length) : 0;
    const topPercentileScore = results.length > 0 ? Math.max(...results) : 0;
    const completionRate = attempts.length > 0 ? Math.round(totalCompletionRate / attempts.length) : 100;

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
