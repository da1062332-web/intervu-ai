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
      assessmentName: result.attempt?.testConfig?.displayName || result.attempt?.examConfig?.name || "Assessment",
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
        assessmentName: res.attempt?.testConfig?.displayName || res.attempt?.examConfig?.name || "Assessment",
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
      assessmentName: result.attempt?.testConfig?.displayName || result.attempt?.examConfig?.name || "Assessment",
      createdAt: result.createdAt,
    };
  }

  async getAnalytics(attemptId: string) {
    const analytics = await this.candidateResultRepo.findAnalytics(attemptId);
    if (!analytics) {
      return {
        topicAccuracy: {},
        difficultyAccuracy: {},
        sectionAccuracy: {},
        completionRate: 0,
        attemptRate: 0,
      };
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
      return {
        practiceSuggestions: ["General Review"],
        focusTopics: ["Core Concepts"],
        improvementPlan: ["Review foundational topics and practice regularly."],
        estimatedPracticeHours: 2,
        priority: "Medium",
      };
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

  async getPerformanceDashboard(attemptId: string) {
    const [result, analytics, evaluation, sections, answers, recommendations] = await Promise.all([
      this.candidateResultRepo.findResultByAttemptId(attemptId),
      this.candidateResultRepo.findAnalytics(attemptId),
      this.prisma.evaluationResult.findFirst({ where: { testInstanceId: attemptId } }),
      this.prisma.testInstanceSection.findMany({ where: { testInstanceId: attemptId } }),
      this.prisma.candidateAnswer.findMany({ where: { testInstanceId: attemptId } }),
      this.getRecommendations(attemptId).catch(() => ({ practiceSuggestions: [] }))
    ]);

    if (!result) {
      throw new NotFoundException(`Result not found for attempt ${attemptId}`);
    }

    const overallScore = result.score;
    const percentage = result.percentage;
    
    let grade = "C";
    if (percentage >= 90) grade = "A+";
    else if (percentage >= 80) grade = "A";
    else if (percentage >= 70) grade = "B";

    const overallAccuracy = result.percentage; 

    const totalQuestions = sections.reduce((sum, s) => sum + s.questionCount, 0);

    let correct = evaluation?.correctAnswers || 0;
    let wrong = evaluation?.incorrectAnswers || 0;

    // Use fallback calculation if evaluation metrics are zeroed out
    if ((correct === 0 && wrong === 0) && (percentage > 0 || answers.length > 0 || !evaluation)) {
      correct = Math.round((percentage / 100) * totalQuestions);
      const answeredCount = answers.length;
      if (answeredCount > 0) {
        wrong = Math.max(0, answeredCount - correct);
      } else {
        wrong = Math.max(0, totalQuestions - correct);
      }
    }

    const skipped = Math.max(0, totalQuestions - (correct + wrong));

    const sectionTimeMap: Record<string, number> = {};
    const questionToSectionMap: Record<string, string> = {};
    
    const tiqs = await this.prisma.testInstanceQuestion.findMany({ 
      where: { testInstanceId: attemptId }, 
      include: { section: true } 
    });
    
    tiqs.forEach(q => {
      questionToSectionMap[q.questionId] = q.section.sectionName;
    });

    let totalSpentSecs = 0;
    const attemptRecord = await this.prisma.testInstance.findUnique({ where: { id: attemptId } });
    const sectionRecords = await this.prisma.testInstanceSection.findMany({ where: { testInstanceId: attemptId } });

    let hasSectionTime = false;
    sectionRecords.forEach(secRecord => {
      if (secRecord.startedAt) {
        let spentSecs = 0;
        if (secRecord.status === 'COMPLETED' || secRecord.status === 'LOCKED') {
           spentSecs = Math.floor((secRecord.updatedAt.getTime() - secRecord.startedAt.getTime()) / 1000);
        } else if (secRecord.status === 'ACTIVE') {
           if (attemptRecord?.submittedAt) {
              spentSecs = Math.floor((attemptRecord.submittedAt.getTime() - secRecord.startedAt.getTime()) / 1000);
           }
        }
        if (spentSecs > 0) {
           sectionTimeMap[secRecord.sectionKey] = Math.max(0, spentSecs);
           sectionTimeMap[secRecord.sectionName] = Math.max(0, spentSecs);
           totalSpentSecs += Math.max(0, spentSecs);
           hasSectionTime = true;
        }
      }
    });

    if (!hasSectionTime) {
      totalSpentSecs = answers.reduce((sum, a) => sum + a.timeSpentSeconds, 0);
      if (totalSpentSecs === 0 && attemptRecord?.submittedAt) {
        totalSpentSecs = Math.floor((attemptRecord.submittedAt.getTime() - attemptRecord.createdAt.getTime()) / 1000);
        if (sections.length === 1) {
          sectionTimeMap[sections[0].sectionName] = totalSpentSecs;
        }
      } else {
        answers.forEach(a => {
          const sectionName = questionToSectionMap[a.questionId];
          if (sectionName) {
            sectionTimeMap[sectionName] = (sectionTimeMap[sectionName] || 0) + a.timeSpentSeconds;
          }
        });
      }
    }

    const sectionTime = sections.map(sec => {
      const spentSecs = sectionTimeMap[sec.sectionKey] || sectionTimeMap[sec.sectionName] || 0;
      const spentMin = Math.round(spentSecs / 60);
      const expectedMin = Math.round(sec.durationSeconds / 60);
      
      let status = "N/A";
      if (spentMin > 0) {
        status = "Good";
        if (spentMin < expectedMin * 0.7) status = "Excellent";
        else if (spentMin > expectedMin * 1.3) status = "Needs Improvement";
        else if (spentMin > expectedMin) status = "Slightly Slow";
      }

      return {
        sectionName: sec.sectionName,
        spentTime: spentMin,
        expectedTime: expectedMin,
        timeDifference: Math.abs(expectedMin - spentMin),
        status
      };
    });

    const totalExpectedSecs = sections.reduce((sum, s) => sum + s.durationSeconds, 0);
    const timeEfficiency = totalExpectedSecs > 0 && totalSpentSecs > 0
      ? Math.min(100, Math.round((totalExpectedSecs / Math.max(totalSpentSecs, 1)) * 100))
      : 100;

    const sectionAccData = typeof analytics?.sectionAccuracy === 'object' 
      ? analytics.sectionAccuracy as Record<string, number> 
      : {};
    
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    const sectionAccuracy = sections.map(sec => {
      let acc = sectionAccData[sec.sectionKey];
      if (acc === undefined) acc = sectionAccData[sec.sectionName];
      if (acc === undefined) {
        if (sections.length === 1) acc = percentage;
        else acc = 0;
      }
      
      const qCount = sec.questionCount;
      const attemptedInSection = answers.filter(a => {
        const mappedSec = questionToSectionMap[a.questionId];
        return mappedSec === sec.sectionName || mappedSec === sec.sectionKey;
      }).length;
      
      const secSkipped = Math.max(0, qCount - attemptedInSection);
      
      let secCorrect = 0;
      let secWrong = 0;
      
      if (attemptedInSection > 0) {
        secCorrect = Math.round((acc / 100) * attemptedInSection);
        secWrong = attemptedInSection - secCorrect;
      }
      
      if (acc >= 85) strengths.push(sec.sectionName);
      else if (acc < 50) weaknesses.push(sec.sectionName);

      return {
        sectionName: sec.sectionName,
        correct: secCorrect,
        wrong: secWrong,
        skipped: secSkipped,
        accuracy: acc
      };
    });

    return {
      overallScore,
      percentage,
      overallAccuracy,
      grade,
      timeEfficiency,
      totalTimeSpent: Math.round(totalSpentSecs / 60),
      strengths,
      weaknesses,
      accuracyDetails: { correct, wrong, skipped },
      sectionAccuracy,
      sectionTime,
      recommendations: recommendations.practiceSuggestions || []
    };
  }
}
