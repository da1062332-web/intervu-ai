import { Injectable, NotFoundException } from "@nestjs/common";
import { CandidateResultRepository } from "../repositories/candidate-result.repository";
import {
  CandidateResultDto,
  PerformanceAnalyticsDto,
} from "@intervu-ai/contracts";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class ResultQueryService {
  constructor(
    private readonly candidateResultRepo: CandidateResultRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getResult(attemptId: string) {
    const result =
      await this.candidateResultRepo.findResultByAttemptId(attemptId);
    if (!result) {
      throw new NotFoundException(`Result for attempt ${attemptId} not found`);
    }

    const state = await this.candidateResultRepo.getEvaluationStatus(attemptId);

    return {
      attemptId: result.attemptId,
      assessmentName: result.attempt?.testConfig?.displayName || "Assessment",
      score: result.score,
      percentage: result.percentage,
      accuracy: 0, // We need to calculate this from evaluation
      completion: 100, // For now, assume 100% if result is generated
      status: state.state?.status || "COMPLETED",
      submittedAt: result.attempt?.submittedAt || result.createdAt,
      rank: 0, // This is retrieved from rank endpoint / service
    };
  }

  async listCandidateResults(
    candidateId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const { items, total } =
      await this.candidateResultRepo.findCandidateResults(
        candidateId,
        page,
        limit,
      );
    return {
      data: items.map((res) => ({
        id: res.id,
        attemptId: res.attemptId,
        candidateId: res.candidateId,
        score: res.score,
        percentage: res.percentage,
        assessmentName: res.attempt?.testConfig?.displayName || "Assessment",
        createdAt: res.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLatestResult(candidateId: string) {
    const result = await this.candidateResultRepo.findLatestResult(candidateId);
    if (!result) {
      throw new NotFoundException(
        `No results found for candidate ${candidateId}`,
      );
    }
    return {
      id: result.id,
      attemptId: result.attemptId,
      score: result.score,
      percentage: result.percentage,
      assessmentName: result.attempt?.testConfig?.displayName || "Assessment",
      createdAt: result.createdAt,
    };
  }

  async getAnalytics(attemptId: string) {
    const analytics = await this.candidateResultRepo.findAnalytics(attemptId);
    if (!analytics) {
      throw new NotFoundException(
        `Analytics not found for attempt ${attemptId}`,
      );
    }
    return {
      topicAccuracy:
        typeof analytics.topicAccuracy === "object"
          ? analytics.topicAccuracy
          : {},
      difficultyAccuracy:
        typeof analytics.difficultyAccuracy === "object"
          ? analytics.difficultyAccuracy
          : {},
      sectionAccuracy:
        typeof analytics.sectionAccuracy === "object"
          ? analytics.sectionAccuracy
          : {},
      completionRate: analytics.completionRate,
      attemptRate: analytics.attemptRate,
    };
  }

  async getAnalysis(attemptId: string) {
    // This will fetch from EvaluationInsight or generate
    const insight = await this.prisma.evaluationInsight.findUnique({
      where: { attemptId },
    });
    if (!insight) {
      return { strengths: [], weaknesses: [] };
    }
    // Transform insights to match the requested format
    const rawInsights = (insight.insights as any[]) || [];
    return {
      strengths: rawInsights
        .filter((i) => i.type === "strength")
        .map((i) => ({ topic: i.topic, score: i.score, remarks: i.remarks })),
      weaknesses: rawInsights
        .filter((i) => i.type === "weakness")
        .map((i) => ({ topic: i.topic, score: i.score, remarks: i.remarks })),
    };
  }

  async getRecommendations(attemptId: string) {
    const recommendations =
      await this.candidateResultRepo.findRecommendations(attemptId);
    if (!recommendations || recommendations.length === 0) {
      throw new NotFoundException(
        `Recommendations not found for attempt ${attemptId}`,
      );
    }
    // Return aggregated payload
    return {
      practiceSuggestions: recommendations.map((r) => r.title),
      focusTopics: recommendations.map((r) => r.skill),
      improvementPlan: recommendations.map((r) => r.description),
      estimatedPracticeHours: recommendations.length * 2,
      priority: recommendations[0]?.priority || "Medium",
    };
  }

  async getDashboardWidgets(candidateId: string) {
    const results =
      await this.candidateResultRepo.findDashboardData(candidateId);
    if (!results || results.length === 0) {
      return null;
    }
    const latest = results[0];
    const best = results.reduce(
      (max, r) => (r.score > max.score ? r : max),
      results[0],
    );

    return {
      latestResult: { score: latest.score, attemptId: latest.attemptId },
      bestScore: best.score,
      recentAttempt: latest.createdAt,
      recommendedPractice: "General Review", // Should come from recommendations
      averageAccuracy:
        results.reduce((acc, curr) => acc + curr.percentage, 0) /
        results.length,
      attemptCount: results.length,
      trend: results
        .slice(0, 5)
        .reverse()
        .map((r) => r.percentage),
    };
  }

  async getStatus(attemptId: string) {
    const { state, evalRun } =
      await this.candidateResultRepo.getEvaluationStatus(attemptId);
    if (!state) {
      throw new NotFoundException(`Attempt ${attemptId} not found`);
    }

    if (state.candidateResult) {
      return { status: "COMPLETED" };
    }
    if (evalRun && evalRun.status === "FAILED") {
      return { status: "FAILED" };
    }
    if (evalRun && evalRun.status === "IN_PROGRESS") {
      return { status: "EVALUATING" };
    }
    if (state.status === "SUBMITTED") {
      return { status: "SUBMITTED" };
    }
    return { status: state.status };
  }
}
