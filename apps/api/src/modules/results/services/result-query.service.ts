import { Injectable, NotFoundException } from "@nestjs/common";
import { CandidateResultRepository } from "../repositories/candidate-result.repository";
import {
  CandidateResultDto,
  PerformanceAnalyticsDto,
} from "@intervu-ai/contracts";
import { PrismaService } from "@/prisma/prisma.service";
import { RecommendationService } from "../../evaluation/recommendations/recommendation.service";
import { ResultGeneratorService } from "../../evaluation/services/result-generator.service";
import { ResultStorageService } from "../../evaluation/services/result-storage.service";

@Injectable()
export class ResultQueryService {
  constructor(
    private readonly candidateResultRepo: CandidateResultRepository,
    private readonly prisma: PrismaService,
    private readonly resultGenerator: ResultGeneratorService,
    private readonly recommendationService: RecommendationService,
  ) {}

  async getResult(attemptId: string) {
    const result =
      await this.candidateResultRepo.findResultByAttemptId(attemptId);
    if (!result) {
      const testInstance = await this.prisma.testInstance.findUnique({
        where: { id: attemptId },
        include: { testConfig: true, examConfig: true, user: true },
      });

      if (testInstance) {
        const state =
          await this.candidateResultRepo.getEvaluationStatus(attemptId);
        return {
          attemptId,
          assessmentName:
            testInstance.testConfig?.displayName ||
            testInstance.examConfig?.name ||
            "Assessment",
          score: 0,
          percentage: 0,
          accuracy: 0,
          completion: 0,
          status: state?.state?.status || "IN_PROGRESS",
          submittedAt: testInstance.submittedAt || testInstance.createdAt,
          rank: 0,
          candidate: (testInstance as any).user
            ? {
                fullName:
                  (testInstance as any).user.fullName ||
                  (testInstance as any).user.name ||
                  "Candidate",
                email: (testInstance as any).user.email || "",
              }
            : undefined,
        };
      }

      throw new NotFoundException(`Result for attempt ${attemptId} not found`);
    }

    const state = await this.candidateResultRepo.getEvaluationStatus(attemptId);

    return {
      attemptId: result.attemptId,
      assessmentName:
        (result as any).attempt?.testConfig?.displayName ||
        (result as any).attempt?.examConfig?.name ||
        "Assessment",
      score: result.score,
      percentage: result.percentage,
      accuracy: 0,
      completion: 100,
      status: state?.state?.status || "COMPLETED",
      submittedAt: (result as any).attempt?.submittedAt || result.createdAt,
      rank: 0,
      candidate: (result as any).attempt?.user
        ? {
            fullName:
              (result as any).attempt.user.fullName ||
              (result as any).attempt.user.name ||
              "Candidate",
            email: (result as any).attempt.user.email || "",
          }
        : undefined,
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
      data: items.map((res: any) => ({
        id: res.id,
        attemptId: res.attemptId,
        candidateId: res.candidateId,
        score: res.score,
        percentage: res.percentage,
        qualification: res.qualification || undefined,
        qualificationReason: res.qualificationReason || undefined,
        evaluationStrategy: res.evaluationStrategy || undefined,
        assessmentName:
          res.attempt?.testConfig?.displayName ||
          res.attempt?.examConfig?.name ||
          "Corporate Assessment",
        createdAt: res.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / Math.max(1, limit)),
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
      assessmentName:
        result.attempt?.testConfig?.displayName ||
        result.attempt?.examConfig?.name ||
        "Assessment",
      createdAt: result.createdAt,
    };
  }

  private async getTopicNameMap(): Promise<Map<string, string>> {
    const topics = await this.prisma.topic.findMany({
      select: { id: true, name: true, code: true },
    });
    const concepts = await this.prisma.concept.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        topic: { select: { name: true } },
      },
    });
    const map = new Map<string, string>();
    topics.forEach((t) => {
      map.set(t.id, t.name);
      if (t.code) map.set(t.code, t.name);
    });
    concepts.forEach((c) => {
      const parentOrName = c.topic?.name || c.name;
      map.set(c.id, parentOrName);
      if (c.code) map.set(c.code, parentOrName);
    });
    return map;
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

    const topicNameMap = await this.getTopicNameMap();
    const rawTopicAccuracy =
      typeof analytics.topicAccuracy === "object"
        ? (analytics.topicAccuracy as Record<string, any>)
        : {};
    const mappedTopicAccuracy: Record<string, any> = {};
    Object.entries(rawTopicAccuracy).forEach(([key, value]) => {
      const cleanName = topicNameMap.get(key) || key;
      mappedTopicAccuracy[cleanName] = value;
    });

    return {
      topicAccuracy: mappedTopicAccuracy,
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
    const topicNameMap = await this.getTopicNameMap();
    return {
      strengths: rawInsights
        .filter((i) => i.type === "strength")
        .map((i) => ({
          topic: topicNameMap.get(i.topic) || i.topic,
          score: i.score,
          remarks: i.remarks,
        })),
      weaknesses: rawInsights
        .filter((i) => i.type === "weakness")
        .map((i) => ({
          topic: topicNameMap.get(i.topic) || i.topic,
          score: i.score,
          remarks: i.remarks,
        })),
    };
  }

  async getRecommendations(attemptId: string) {
    const dbRecs =
      await this.candidateResultRepo.findRecommendations(attemptId);
    let recList = dbRecs || [];

    if (!recList || recList.length === 0) {
      try {
        const analytics = await this.getAnalytics(attemptId);
        const generated = this.recommendationService.generateRecommendations(
          analytics as any,
        );
        recList = generated.map((g) => ({
          title: g.title,
          description: g.description,
          skill: g.skill,
          priority: g.priority,
        })) as any[];
      } catch {
        // Ignore fallback error
      }
    }

    if (!recList || recList.length === 0) {
      return {
        practiceSuggestions: ["General Review"],
        focusTopics: ["Core Concepts"],
        improvementPlan: ["Review foundational topics and practice regularly."],
        estimatedPracticeHours: 2,
        priority: "Medium",
      };
    }

    const topicNameMap = await this.getTopicNameMap();
    return {
      practiceSuggestions: recList.map((r) => r.title),
      focusTopics: recList.map((r) => topicNameMap.get(r.skill) || r.skill),
      improvementPlan: recList.map((r) => r.description),
      estimatedPracticeHours: recList.length * 2,
      priority: recList[0]?.priority || "Medium",
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
      (max, r) => (r.percentage > max.percentage ? r : max),
      results[0],
    );

    return {
      latestResult: {
        score: Math.round(latest.percentage),
        attemptId: latest.attemptId,
      },
      bestScore: Math.round(best.percentage),
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

    if (state.candidateResult || (state as any).evaluationResult) {
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
    let [result, analytics, evaluation, sections, answers, recommendations] =
      await Promise.all([
        this.candidateResultRepo.findResultByAttemptId(attemptId),
        this.candidateResultRepo.findAnalytics(attemptId),
        this.prisma.evaluationResult.findFirst({
          where: { testInstanceId: attemptId },
        }),
        this.prisma.testInstanceSection.findMany({
          where: { testInstanceId: attemptId },
        }),
        this.prisma.candidateAnswer.findMany({
          where: { testInstanceId: attemptId },
        }),
        this.getRecommendations(attemptId).catch(() => ({
          practiceSuggestions: [],
        })),
      ]);

    if (!result) {
      const testInstance = await this.prisma.testInstance.findUnique({
        where: { id: attemptId },
      });

      if (
        testInstance &&
        (testInstance.status === "SUBMITTED" || testInstance.submittedAt)
      ) {
        try {
          const executionResult = {
            executionId: testInstance.id,
            testId: testInstance.id,
            status: "submitted",
            submittedAt: testInstance.submittedAt || new Date(),
            answers: answers.map((a) => ({
              questionId: a.questionId,
              answer: String(a.answer || ""),
              timeSpentSeconds: a.timeSpentSeconds || 0,
              isMarkedForReview: a.isMarkedForReview || false,
            })),
          };
          const generated = await this.resultGenerator?.generateResult(
            executionResult as any,
          );
          if (generated) {
            const storage = new ResultStorageService(this.prisma);
            await storage.saveResult(generated, 1000);
            result =
              await this.candidateResultRepo.findResultByAttemptId(attemptId);
            analytics = await this.candidateResultRepo.findAnalytics(attemptId);
            evaluation = await this.prisma.evaluationResult.findFirst({
              where: { testInstanceId: attemptId },
            });
          }
        } catch (e) {
          // Ignore fallback error and let NotFoundException throw if still null
        }
      }

      if (!result) {
        throw new NotFoundException(
          `Result not found for attempt ${attemptId}`,
        );
      }
    }

    const overallScore = result.score;
    const percentage = result.percentage;

    let grade = "C";
    if (percentage >= 90) grade = "A+";
    else if (percentage >= 80) grade = "A";
    else if (percentage >= 70) grade = "B";

    const overallAccuracy = result.percentage;

    const totalQuestions = sections.reduce(
      (sum, s) => sum + s.questionCount,
      0,
    );

    let correct = evaluation?.correctAnswers || 0;
    let wrong = evaluation?.incorrectAnswers || 0;

    // Use fallback calculation if evaluation metrics are zeroed out
    if (
      correct === 0 &&
      wrong === 0 &&
      (percentage > 0 || answers.length > 0 || !evaluation)
    ) {
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
      include: { section: true },
    });

    tiqs.forEach((q) => {
      if (q.section) {
        questionToSectionMap[q.questionId] = q.section.sectionName;
        questionToSectionMap[`${q.questionId}_key`] = q.section.sectionKey;
      }
    });

    let totalSpentSecs = 0;
    const attemptRecord = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
    });
    const sectionRecords = await this.prisma.testInstanceSection.findMany({
      where: { testInstanceId: attemptId },
    });

    sectionRecords.forEach((secRecord) => {
      if (secRecord.startedAt) {
        let spentSecs = 0;
        if (secRecord.status === "COMPLETED" || secRecord.status === "LOCKED") {
          spentSecs = Math.floor(
            (secRecord.updatedAt.getTime() - secRecord.startedAt.getTime()) /
              1000,
          );
        } else if (
          secRecord.status === "ACTIVE" &&
          attemptRecord?.submittedAt
        ) {
          spentSecs = Math.floor(
            (attemptRecord.submittedAt.getTime() -
              secRecord.startedAt.getTime()) /
              1000,
          );
        }
        if (spentSecs > 0) {
          sectionTimeMap[secRecord.sectionKey] = Math.max(0, spentSecs);
          sectionTimeMap[secRecord.sectionName] = Math.max(0, spentSecs);
          totalSpentSecs += Math.max(0, spentSecs);
        }
      }
    });

    // Sum per-question answer timeSpentSeconds for each section
    const answerTimeMap: Record<string, number> = {};
    answers.forEach((a) => {
      const sectionName = questionToSectionMap[a.questionId];
      const sectionKey = questionToSectionMap[`${a.questionId}_key`];
      if (sectionName) {
        answerTimeMap[sectionName] =
          (answerTimeMap[sectionName] || 0) + (a.timeSpentSeconds || 0);
      }
      if (sectionKey) {
        answerTimeMap[sectionKey] =
          (answerTimeMap[sectionKey] || 0) + (a.timeSpentSeconds || 0);
      }
    });

    // Merge answerTimeMap into sectionTimeMap for any section missing spent time
    for (const [k, v] of Object.entries(answerTimeMap)) {
      if (!sectionTimeMap[k] || sectionTimeMap[k] === 0) {
        sectionTimeMap[k] = v;
      }
    }

    // Fallback: if sectionTimeMap for an attempted section is still 0, derive from total wall-clock duration
    const wallClockSecs =
      attemptRecord?.submittedAt && attemptRecord?.startedAt
        ? Math.floor(
            (attemptRecord.submittedAt.getTime() -
              attemptRecord.startedAt.getTime()) /
              1000,
          )
        : attemptRecord?.submittedAt && attemptRecord?.createdAt
          ? Math.floor(
              (attemptRecord.submittedAt.getTime() -
                attemptRecord.createdAt.getTime()) /
                1000,
            )
          : 0;

    if (wallClockSecs > 0) {
      const totalQ = Math.max(1, tiqs.length);
      sections.forEach((sec) => {
        const spent =
          sectionTimeMap[sec.sectionKey] ||
          sectionTimeMap[sec.sectionName] ||
          0;
        if (spent === 0) {
          const secQCount =
            tiqs.filter(
              (q) =>
                q.section?.sectionKey === sec.sectionKey ||
                q.section?.sectionName === sec.sectionName,
            ).length ||
            sec.questionCount ||
            1;
          const estimatedSecs = Math.round(
            (wallClockSecs * secQCount) / totalQ,
          );
          sectionTimeMap[sec.sectionKey] = estimatedSecs;
          sectionTimeMap[sec.sectionName] = estimatedSecs;
        }
      });
    }

    const sectionAccData =
      typeof analytics?.sectionAccuracy === "object"
        ? (analytics.sectionAccuracy as Record<string, number>)
        : {};

    const sectionTime = sections.map((sec) => {
      const normalize = (s: string) =>
        s.toLowerCase().replace(/[^a-z0-9]/g, "");
      const secKeyNorm = normalize(sec.sectionKey || "");
      const secNameNorm = normalize(sec.sectionName || "");

      let spentSecs =
        sectionTimeMap[sec.sectionKey] || sectionTimeMap[sec.sectionName] || 0;
      if (!spentSecs) {
        for (const [k, v] of Object.entries(sectionTimeMap)) {
          const kNorm = normalize(k);
          if (
            kNorm === secKeyNorm ||
            kNorm === secNameNorm ||
            kNorm.includes(secKeyNorm) ||
            secKeyNorm.includes(kNorm)
          ) {
            spentSecs = v;
            break;
          }
        }
      }

      const spentMin =
        spentSecs > 0 && spentSecs < 60 ? 1 : Math.round(spentSecs / 60);
      const expectedMin = Math.round(sec.durationSeconds / 60);
      const qCount = sec.questionCount || 1;

      let acc = sectionAccData[sec.sectionKey];
      if (acc === undefined) acc = sectionAccData[sec.sectionName];
      if (acc === undefined) {
        for (const [k, v] of Object.entries(sectionAccData)) {
          const kNorm = normalize(k);
          if (
            kNorm === secKeyNorm ||
            kNorm === secNameNorm ||
            kNorm.includes(secKeyNorm) ||
            secKeyNorm.includes(kNorm)
          ) {
            acc = v;
            break;
          }
        }
      }
      if (acc === undefined) {
        if (sections.length === 1) acc = percentage;
        else acc = 0;
      }

      let status = "N/A";
      let pacingFeedback = "Pacing analysis pending";

      const timeUsedPercentage =
        expectedMin > 0 ? Math.round((spentMin / expectedMin) * 100) : 0;
      const avgSecsPerQ = Math.round(spentSecs / Math.max(1, qCount));
      const avgTimePerQuestion =
        avgSecsPerQ >= 60
          ? `${(avgSecsPerQ / 60).toFixed(1)}m`
          : `${avgSecsPerQ}s`;

      if (spentSecs === 0 && acc === 0) {
        status = "N/A";
        pacingFeedback = "Section not attempted";
      } else if (acc < 50) {
        status = "Needs Improvement";
        pacingFeedback = `Rushed or low accuracy (${acc}% acc, ${timeUsedPercentage}% time used)`;
      } else if (timeUsedPercentage > 125) {
        status = "Needs Improvement";
        pacingFeedback = `Exceeded target time (${timeUsedPercentage}% time used)`;
      } else if (timeUsedPercentage > 100) {
        status = "Slightly Slow";
        pacingFeedback = `Slightly over expected time (${timeUsedPercentage}% time used)`;
      } else if (acc >= 80) {
        status = "Excellent";
        pacingFeedback = `Optimal pacing & high accuracy (${acc}% acc, ${timeUsedPercentage}% time used)`;
      } else {
        status = "Good";
        pacingFeedback = `Steady pace (${acc}% acc, ${timeUsedPercentage}% time used)`;
      }

      return {
        sectionName: sec.sectionName,
        spentTime: spentMin,
        expectedTime: expectedMin,
        timeDifference: Math.abs(expectedMin - spentMin),
        status,
        accuracy: acc,
        questionCount: qCount,
        avgTimePerQuestion,
        timeUsedPercentage,
        pacingFeedback,
      };
    });

    const totalExpectedSecs = sections.reduce(
      (sum, s) => sum + s.durationSeconds,
      0,
    );

    const actualSpentSecs = sectionTime.reduce((sum, s) => {
      const spent = sectionTimeMap[s.sectionName] || 0;
      return sum + spent;
    }, 0);

    let timeEfficiency = 0;
    if (totalExpectedSecs > 0 && actualSpentSecs > 0) {
      const ratio = actualSpentSecs / totalExpectedSecs;
      if (ratio <= 1) {
        timeEfficiency = Math.round(ratio * 100);
      } else {
        timeEfficiency = Math.max(0, Math.round((2 - ratio) * 100));
      }
    }

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const detailedStrengthsWeaknesses: {
      name: string;
      score: number;
      category: "STRENGTH" | "NEEDS_IMPROVEMENT" | "WEAKNESS";
      feedback: string;
    }[] = [];

    const isUUID = (str: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        str,
      );

    // Query database Question table for questions in tiqs to get authoritative topic relations
    const questionIds = tiqs.map((q) => q.questionId).filter(Boolean);
    const dbQuestions = await this.prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: { topic: true },
    });
    const dbQuestionMap = new Map(dbQuestions.map((q) => [q.id, q]));

    const allTopics = await this.prisma.topic.findMany({
      select: { id: true, name: true },
    });
    const topicMap: Record<string, string> = {};
    allTopics.forEach((t) => {
      topicMap[t.id] = t.name;
    });
    const topicAccuracyMap =
      (analytics?.topicAccuracy as Record<string, number>) || {};

    const topicStats: Record<
      string,
      { topicName: string; sectionName: string; total: number }
    > = {};

    tiqs.forEach((q, idx) => {
      const snap = (q.questionSnapshot || {}) as any;
      const secName = q.section.sectionName;
      const dbQ = dbQuestionMap.get(q.questionId);

      let tName =
        snap.topicName ||
        (typeof snap.topic === "string" && !isUUID(snap.topic)
          ? snap.topic
          : null) ||
        (snap.topicId ? topicMap[snap.topicId] : null) ||
        dbQ?.topic?.name ||
        snap.conceptKey ||
        snap.concept ||
        snap.category ||
        snap.skill ||
        snap.subTopic;

      if (!tName || isUUID(tName) || tName === secName) {
        // Fallback for topics if not specified: group into distinct concept areas per section
        if (secName.toLowerCase().includes("reasoning")) {
          const reasoningSubtopics = [
            "Logical Deductions & Pattern Recognition",
            "Analytical & Problem Solving",
          ];
          tName = reasoningSubtopics[idx % reasoningSubtopics.length];
        } else if (secName.toLowerCase().includes("coding")) {
          const codingSubtopics = [
            "Algorithms & Data Structures",
            "Syntax & Problem Logic",
          ];
          tName = codingSubtopics[idx % codingSubtopics.length];
        } else {
          tName = `${secName} Core Concepts`;
        }
      }

      const key = `${secName}::${tName}`;
      if (!topicStats[key]) {
        topicStats[key] = { topicName: tName, sectionName: secName, total: 0 };
      }
      topicStats[key].total += 1;
    });

    const topicAccuracyList = Object.values(topicStats).map((ts) => {
      let secAcc = sectionAccData[ts.sectionName];
      if (secAcc === undefined && sections.length === 1) secAcc = percentage;
      if (secAcc === undefined) secAcc = percentage || 0;

      // Check if topic accuracy exists in analytics
      let acc = topicAccuracyMap[ts.topicName];
      if (acc === undefined) acc = secAcc;

      const accuracy = Math.min(100, Math.max(0, Math.round(acc)));
      const correct = Math.round((accuracy / 100) * ts.total);

      return {
        topicName: ts.topicName,
        sectionName: ts.sectionName,
        total: ts.total,
        correct,
        accuracy,
      };
    });

    const sectionAccuracy = sections.map((sec) => {
      let acc = sectionAccData[sec.sectionKey];
      if (acc === undefined) acc = sectionAccData[sec.sectionName];
      if (acc === undefined) {
        if (sections.length === 1) acc = percentage;
        else acc = 0;
      }

      const qCount = sec.questionCount;
      const attemptedInSection = answers.filter((a) => {
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

      if (acc >= 60) strengths.push(sec.sectionName);
      else if (acc < 60) weaknesses.push(sec.sectionName);

      const category: "STRENGTH" | "NEEDS_IMPROVEMENT" | "WEAKNESS" =
        acc >= 70 ? "STRENGTH" : acc >= 50 ? "NEEDS_IMPROVEMENT" : "WEAKNESS";

      const feedback =
        acc >= 70
          ? `High accuracy (${acc}%). Strong mastery in ${sec.sectionName}.`
          : acc >= 50
            ? `Moderate accuracy (${acc}%). Re-review core concepts for better score.`
            : `Critical weak area (${acc}% accuracy). Needs active practice & fundamental review.`;

      detailedStrengthsWeaknesses.push({
        name: sec.sectionName,
        score: acc,
        category,
        feedback,
      });

      const topicsForSec = topicAccuracyList.filter(
        (t) => t.sectionName === sec.sectionName,
      );

      return {
        sectionName: sec.sectionName,
        correct: secCorrect,
        wrong: secWrong,
        skipped: secSkipped,
        accuracy: acc,
        topics: topicsForSec,
      };
    });

    // Note: Only section-level performance is included for strengths & weaknesses per requirements

    // Fallback: Ensure at least the top performing section is in strengths if candidate scored > 0
    if (strengths.length === 0 && sectionAccuracy.length > 0) {
      const bestSection = [...sectionAccuracy].sort(
        (a, b) => b.accuracy - a.accuracy,
      )[0];
      if (
        bestSection &&
        bestSection.accuracy > 0 &&
        !isUUID(bestSection.sectionName)
      ) {
        strengths.push(bestSection.sectionName);
        // Remove from weaknesses if present
        const idx = weaknesses.indexOf(bestSection.sectionName);
        if (idx !== -1) weaknesses.splice(idx, 1);
      }
    }

    let codingMaxMarks = 0;
    let objectiveMaxMarks = 0;

    tiqs.forEach((q) => {
      const snap = (q.questionSnapshot || {}) as any;
      const secName = (q.section?.sectionName || "").toLowerCase();
      const qType = (snap.questionType || snap.type || "MCQ").toUpperCase();
      const marks = snap.marks || snap.maxMarks || 1;

      const isCoding =
        qType === "CODING" ||
        secName.includes("coding") ||
        secName.includes("programming");

      if (isCoding) {
        codingMaxMarks += marks;
      } else {
        objectiveMaxMarks += marks;
      }
    });

    const codingSec = sectionAccuracy.find(
      (s) =>
        s.sectionName.toLowerCase().includes("coding") ||
        s.sectionName.toLowerCase().includes("programming"),
    );

    let computedCodingScore = evaluation?.technicalScore;
    if (computedCodingScore === undefined || computedCodingScore === null) {
      if (codingSec && codingMaxMarks > 0) {
        computedCodingScore = Math.round(
          (codingSec.accuracy / 100) * codingMaxMarks,
        );
      } else if (codingSec) {
        computedCodingScore = Math.round(codingSec.accuracy);
      } else {
        computedCodingScore = 0;
      }
    }

    const calculatedMax = objectiveMaxMarks + codingMaxMarks;
    const finalMaxMarks =
      calculatedMax > 0
        ? calculatedMax
        : percentage > 0
          ? Math.round((overallScore / percentage) * 100)
          : overallScore;

    let qualification: string | null = result.qualification;
    let qualificationReason: string | null = result.qualificationReason;
    let evaluationStrategy: string | null = result.evaluationStrategy;
    let foundationScore: number | null = result.foundationScore;
    let advancedScore: number | null = result.advancedScore;
    let codingSolved: number | null = result.codingSolved;
    let qualificationDetails: any = result.qualificationDetails;

    // Dynamic on-the-fly evaluation to sync qualification fields according to current hiring config
    if (!result.evaluatedAt) {
      try {
        const fullResult = await this.resultGenerator.generateResult({
          executionId: attemptId,
          testId: attemptId,
          status: "submitted",
          submittedAt: attemptRecord?.submittedAt || new Date(),
          answers: answers.map((a) => ({
            questionId: a.questionId,
            answer: String(a.answer),
            timeSpentSeconds: a.timeSpentSeconds || 0,
            isMarkedForReview: false,
          })),
        });

        qualification = fullResult.qualification || null;
        qualificationReason = fullResult.qualificationReason || null;
        evaluationStrategy = fullResult.evaluationStrategy || null;
        foundationScore = fullResult.foundationScore ?? null;
        advancedScore = fullResult.advancedScore ?? null;
        codingSolved = fullResult.codingSolved ?? null;
        qualificationDetails = fullResult.qualificationDetails || null;

        // Asynchronously persist computed qualification (or null if disabled) back to DB
        this.prisma.candidateResult
          .update({
            where: { attemptId },
            data: {
              qualification: fullResult.qualification || null,
              qualificationReason: fullResult.qualificationReason || null,
              evaluationStrategy: fullResult.evaluationStrategy || null,
              foundationScore: fullResult.foundationScore ?? null,
              advancedScore: fullResult.advancedScore ?? null,
              codingSolved: fullResult.codingSolved ?? null,
              qualificationDetails:
                (fullResult.qualificationDetails as any) || null,
              evaluatedAt: fullResult.evaluatedAt
                ? new Date(fullResult.evaluatedAt)
                : new Date(),
            },
          })
          .catch(() => {});
      } catch {
        // Ignore fallback evaluation error
      }
    } else if (this.resultGenerator?.generateResult) {
      // Fire and forget re-evaluation in background to keep data fresh without blocking response
      this.resultGenerator
        .generateResult({
          executionId: attemptId,
          testId: attemptId,
          status: "submitted",
          submittedAt: attemptRecord?.submittedAt || new Date(),
          answers: answers.map((a) => ({
            questionId: a.questionId,
            answer: String(a.answer),
            timeSpentSeconds: a.timeSpentSeconds || 0,
            isMarkedForReview: false,
          })),
        })
        .then((fullResult) => {
          this.prisma.candidateResult
            .update({
              where: { attemptId },
              data: {
                qualification: fullResult.qualification || null,
                qualificationReason: fullResult.qualificationReason || null,
                evaluationStrategy: fullResult.evaluationStrategy || null,
                foundationScore: fullResult.foundationScore ?? null,
                advancedScore: fullResult.advancedScore ?? null,
                codingSolved: fullResult.codingSolved ?? null,
                qualificationDetails:
                  (fullResult.qualificationDetails as any) || null,
                evaluatedAt: fullResult.evaluatedAt
                  ? new Date(fullResult.evaluatedAt)
                  : new Date(),
              },
            })
            .catch(() => {});
        })
        .catch(() => {});
    }

    let rank = 1;
    let totalCandidates = 1;
    let percentile = 100;

    try {
      const testConfigId = attemptRecord?.testConfigId;
      const examConfigId = attemptRecord?.examConfigId;
      const whereClause = testConfigId
        ? { attempt: { testConfigId } }
        : examConfigId
          ? { attempt: { examConfigId } }
          : {};

      const candidateResults = await this.prisma.candidateResult.findMany({
        where: whereClause,
        select: { percentage: true },
      });

      if (candidateResults && candidateResults.length > 0) {
        totalCandidates = candidateResults.length;
        const currentPct = percentage;
        let countHigher = 0;
        let countEqual = 0;

        for (const cr of candidateResults) {
          const p = cr.percentage ?? 0;
          if (p > currentPct) {
            countHigher++;
          } else if (Math.abs(p - currentPct) < 0.001) {
            countEqual++;
          }
        }

        rank = countHigher + 1;
        const countLess = totalCandidates - countHigher - countEqual;
        percentile =
          totalCandidates > 0
            ? parseFloat(
                (
                  ((countLess + 0.5 * countEqual) / totalCandidates) *
                  100
                ).toFixed(1),
              )
            : 100;
      }
    } catch {
      // Ignore rank calculation error fallback
    }

    return {
      assessmentName:
        result.attempt?.testConfig?.displayName ||
        result.attempt?.examConfig?.name ||
        "Assessment",
      overallScore,
      percentage,
      overallAccuracy,
      grade,
      timeEfficiency,
      totalTimeSpent: Math.round(totalSpentSecs / 60),
      strengths,
      weaknesses,
      detailedStrengthsWeaknesses,
      accuracyDetails: { correct, wrong, skipped },
      sectionAccuracy,
      topicAccuracy: topicAccuracyList,
      sectionTime,
      recommendations: recommendations.practiceSuggestions || [],
      // Enriched fields from EvaluationResult
      objectiveScore: evaluation?.communicationScore || 0,
      codingScore: computedCodingScore || 0,
      objectiveMaxMarks,
      codingMaxMarks:
        codingMaxMarks <= 10 && (computedCodingScore || 0) > codingMaxMarks
          ? 100
          : codingMaxMarks || (codingSec ? 100 : 0),
      passed: evaluation?.overallRating === 1,
      hasCodingSection: !!codingSec || codingMaxMarks > 0,
      maxMarks: finalMaxMarks,
      // Ranking & Percentile
      rank,
      totalCandidates,
      percentile,
      // Hiring Evaluation fields
      qualification,
      qualificationReason,
      evaluationStrategy,
      foundationScore,
      advancedScore,
      codingSolved,
      qualificationDetails,
    };
  }
}
