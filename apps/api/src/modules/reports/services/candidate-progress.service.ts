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
        assessmentCount: 0,
        averageScore: 0,
        historicalPerformance: [],
        topicImprovement: [],
        skillGrowth: [],
        difficultyTrends: [],
        accuracyTrends: [],
        completionTrends: { completed: 0, abandoned: 0, completionRate: 0 },
      };
    }

    // Average Score
    const totalScore = evaluations.reduce((sum, e) => sum + e.overallScore, 0);
    const averageScore = Math.round(totalScore / totalAssessments);

    // Historical Performance & Accuracy Trends
    const historicalPerformance = evaluations.map((e) => ({
      attemptId: e.testInstanceId,
      date: e.evaluatedAt,
      score: e.overallScore,
      testName: e.testInstance?.testConfig?.displayName || "Assessment",
    }));

    const accuracyTrends = evaluations.map((e) => {
      const totalQ = e.totalQuestions || 1;
      const correct = e.correctAnswers || 0;
      return {
        attemptId: e.testInstanceId,
        date: e.evaluatedAt,
        accuracy: Math.round((correct / totalQ) * 100),
      };
    });

    // Skill Growth Trends
    const skillScoresMap: Record<string, { date: Date; score: number }[]> = {};
    evaluations.forEach((e) => {
      const date = e.evaluatedAt;
      (e.skillScores || []).forEach((s: any) => {
        if (!skillScoresMap[s.skill]) {
          skillScoresMap[s.skill] = [];
        }
        skillScoresMap[s.skill].push({ date, score: s.score });
      });
    });

    const skillGrowth = Object.keys(skillScoresMap).map((skill) => ({
      skill,
      history: skillScoresMap[skill],
    }));

    // Difficulty Trends
    const difficultyMap: Record<string, { totalScore: number; count: number }> =
      {};
    evaluations.forEach((e) => {
      const difficulty =
        e.testInstance?.testConfig?.difficultyLevel || "MEDIUM";
      if (!difficultyMap[difficulty]) {
        difficultyMap[difficulty] = { totalScore: 0, count: 0 };
      }
      difficultyMap[difficulty].totalScore += e.overallScore;
      difficultyMap[difficulty].count++;
    });

    const difficultyTrends = Object.keys(difficultyMap).map((difficulty) => ({
      difficulty,
      averageScore: Math.round(
        difficultyMap[difficulty].totalScore / difficultyMap[difficulty].count,
      ),
      count: difficultyMap[difficulty].count,
    }));

    // Topic Performance & Improvement
    const topicScores: Record<string, { correct: number; total: number }> = {};
    answers.forEach((ans) => {
      // Find question details
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

        if (!topicScores[topic]) {
          topicScores[topic] = { correct: 0, total: 0 };
        }
        topicScores[topic].total++;
        if (isCorrect) {
          topicScores[topic].correct++;
        }
      }
    });

    const topicImprovement = Object.keys(topicScores).map((topic) => ({
      topic,
      accuracy: Math.round(
        (topicScores[topic].correct / topicScores[topic].total) * 100,
      ),
      totalQuestions: topicScores[topic].total,
    }));

    // Completion Trends
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
      assessmentCount: totalAssessments,
      averageScore,
      historicalPerformance,
      topicImprovement,
      skillGrowth,
      difficultyTrends,
      accuracyTrends,
      completionTrends: {
        completed: completedCount,
        abandoned: abandonedCount,
        completionRate,
      },
    };
  }
}
