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

    // 1. Fetch all evaluation results for this user
    const evaluations = await this.prisma.evaluationResult.findMany({
      where: { userId },
      orderBy: { evaluatedAt: "asc" },
      include: {
        skillScores: true,
        testInstance: {
          include: {
            testConfig: true,
          },
        },
      },
    });

    // 2. Fetch all candidate answers and question mappings for topic/difficulty resolution
    const candidateAnswers = await this.prisma.candidateAnswer.findMany({
      where: {
        testInstance: {
          userId,
        },
      },
      include: {
        testInstance: {
          include: {
            sections: {
              include: {
                questions: true,
              },
            },
          },
        },
      },
    });

    const report = this.compileProgressReport(evaluations, candidateAnswers);

    // 3. Cache the compiled result for 10 minutes (600 seconds)
    await this.cacheService.set(cacheKey, report, {
      prefix: this.CACHE_PREFIX,
      ttl: 600,
    });

    // 4. Log audit event
    await this.auditService.logProgressViewed(userId);

    return report;
  }

  async invalidateCache(userId: string): Promise<void> {
    this.logger.debug("Invalidating progress cache", { userId });
    await this.cacheService.delete(`${userId}`, { prefix: this.CACHE_PREFIX });
  }

  private compileProgressReport(evaluations: any[], answers: any[]): any {
    const totalAssessments = evaluations.length;
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
    const trend = evaluations.map((e) => ({
      date: e.evaluatedAt,
      score: e.overallScore,
      label: e.testInstance?.testConfig?.displayName || "Assessment",
    }));

    // Skills
    const topicScores: Record<string, { correct: number; total: number }> = {};
    answers.forEach((ans) => {
      let foundQuestion: any = null;
      for (const section of ans.testInstance.sections) {
        foundQuestion = section.questions.find(
          (q: any) => q.questionId === ans.questionId,
        );
        if (foundQuestion) break;
      }

      if (foundQuestion) {
        const snap = foundQuestion.questionSnapshot as Record<string, any>;
        const topic = snap?.conceptKey || "General";
        const correctVal =
          snap?.correctOption || snap?.correctAnswer || snap?.answer;
        const isCorrect =
          correctVal &&
          String(ans.answer).toLowerCase().trim() ===
            String(correctVal).toLowerCase().trim();

        if (!topicScores[topic]) topicScores[topic] = { correct: 0, total: 0 };
        topicScores[topic].total++;
        if (isCorrect) topicScores[topic].correct++;
      }
    });

    const skills = Object.keys(topicScores).map((topic) => ({
      topic,
      score: Math.round(
        (topicScores[topic].correct / topicScores[topic].total) * 100,
      ),
    }));

    // Difficulty
    const difficulty = {
      easy: { attempted: 0, correct: 0 },
      medium: { attempted: 0, correct: 0 },
      hard: { attempted: 0, correct: 0 },
    };

    answers.forEach((ans) => {
      let foundQuestion: any = null;
      for (const section of ans.testInstance.sections) {
        foundQuestion = section.questions.find(
          (q: any) => q.questionId === ans.questionId,
        );
        if (foundQuestion) break;
      }

      if (foundQuestion) {
        const snap = foundQuestion.questionSnapshot as Record<string, any>;
        const diff = (snap?.difficultyLevel || "MEDIUM").toLowerCase() as
          | "easy"
          | "medium"
          | "hard";
        const correctVal =
          snap?.correctOption || snap?.correctAnswer || snap?.answer;
        const isCorrect =
          correctVal &&
          String(ans.answer).toLowerCase().trim() ===
            String(correctVal).toLowerCase().trim();

        if (difficulty[diff]) {
          difficulty[diff].attempted++;
          if (isCorrect) difficulty[diff].correct++;
        }
      }
    });

    // Overview
    const totalScore = evaluations.reduce((sum, e) => sum + e.overallScore, 0);
    const averageScore = Math.round(totalScore / totalAssessments);
    const topPercentileScore = Math.max(
      ...evaluations.map((e) => e.overallScore),
    );

    const completedCount = evaluations.length;
    const abandonedCount = answers.filter(
      (a) =>
        a.testInstance.status === "EXPIRED" ||
        a.testInstance.status === "TERMINATED",
    ).length;
    const totalAttempts = completedCount + abandonedCount;
    const completionRate =
      totalAttempts > 0
        ? Math.round((completedCount / totalAttempts) * 100)
        : 100;

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
      // Explicit aliases for specific report requirements
      attemptsOverTime: trend,
      bestScore: topPercentileScore,
      weakTopics: skills.filter((s) => s.score < 60),
      improvingTopics: skills.filter((s) => s.score >= 60),
    };
  }
}
