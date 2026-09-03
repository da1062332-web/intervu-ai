import { Injectable } from "@nestjs/common";
import { CandidateDashboardRepository } from "../repositories/candidate-dashboard.repository";
import { CandidateDashboardResponseDto } from "../dto/candidate-dashboard.dto";
import { EntitlementService } from "../../billing/services/entitlement.service";

@Injectable()
export class CandidateDashboardService {
  constructor(
    private readonly dashboardRepository: CandidateDashboardRepository,
    private readonly entitlementService: EntitlementService,
  ) {}

  async getDashboardData(
    userId: string,
  ): Promise<CandidateDashboardResponseDto> {
    const data = await this.dashboardRepository.getDashboardData(userId);
    const attemptsByConfig: Record<string, number> =
      (data as any).attemptsByConfig || {};

    // 1. Fetch user entitlements from active subscription plan
    let entitlements = null;
    try {
      entitlements = await this.entitlementService.getUserEntitlements(userId);
    } catch {}

    const hasActivePlan = Boolean(entitlements?.hasActivePlan);
    const features = (entitlements?.features as any) || {};
    const historyLimit = features.roundHistoryLimit ?? features.history_limit ?? null;

    // Resolve allowed_assessments and custom attemptsPerExam
    const allowedAssessmentsVal = features.allowedAssessments || features.allowed_assessments;
    let allowedList: string[] | null = null;
    let attemptsPerExamOverride: number | null = null;

    if (allowedAssessmentsVal) {
      if (typeof allowedAssessmentsVal === "object" && !Array.isArray(allowedAssessmentsVal)) {
        if (Array.isArray(allowedAssessmentsVal.assessments)) {
          allowedList = allowedAssessmentsVal.assessments;
        }
        if (typeof allowedAssessmentsVal.attemptsPerExam === "number") {
          attemptsPerExamOverride = allowedAssessmentsVal.attemptsPerExam;
        }
      } else if (Array.isArray(allowedAssessmentsVal)) {
        allowedList = allowedAssessmentsVal;
      }
    }

    // Active / in-progress tests
    const activeAttempts = hasActivePlan
      ? data.activeAttempts.map((t: any) => {
          const totalDuration = t.examConfig
            ? t.examConfig.durationMinutes * 60
            : t.testConfig?.totalDurationSeconds || 3600;
          const elapsed = Math.floor((Date.now() - t.createdAt.getTime()) / 1000);
          const remaining = Math.max(0, totalDuration - elapsed);
          return {
            instanceId: t.id,
            configId: t.examConfigId || t.testConfigId,
            name: t.examConfig?.name || t.testConfig?.displayName || "Unknown Test",
            startedAt: t.createdAt.toISOString(),
            timeRemainingSeconds: remaining,
          };
        })
      : [];

    // Completed tests – every attempt, newest first (respecting history retention limit)
    let completedTests = hasActivePlan
      ? data.completedTests.map((t: any) => ({
          instanceId: t.id,
          configId: t.examConfigId || t.testConfigId,
          name: t.examConfig?.name || t.testConfig?.displayName || "Unknown Test",
          score: Math.round(
            t.candidateResult?.percentage ??
              t.evaluationResult?.confidenceScore ??
              t.evaluationResult?.overallScore ??
              0,
          ),
          submittedAt: t.updatedAt?.toISOString() || null,
        }))
      : [];

    if (hasActivePlan && typeof historyLimit === "number" && historyLimit > 0) {
      completedTests = completedTests.slice(0, historyLimit);
    }

    // Enrollments → "upcoming" (not started or re-attemptable)
    const upcomingTests = hasActivePlan
      ? data.enrollments
          .filter((e: any) => {
            const configId = e.examConfigId || e.testId;
            if (!allowedList || allowedList.includes("all")) return true;
            return (
              allowedList.includes(configId) ||
              (e.examConfig?.code && allowedList.includes(e.examConfig.code)) ||
              (e.examConfig?.name && allowedList.includes(e.examConfig.name))
            );
          })
          .map((e: any) => {
            const configId = e.examConfigId || e.testId;
            const attemptCount = attemptsByConfig[configId] || 0;
            const maxAttempts =
              attemptsPerExamOverride ??
              (e.examConfig?.ruleFlags?.maxAttempts ?? 3);
            const canReattempt = attemptCount < maxAttempts;
            const hasActiveAttempt = data.activeAttempts.some(
              (a: any) => a.examConfigId === configId || a.testConfigId === configId,
            );

            return {
              configId,
              name: e.examConfig?.name || e.testConfig?.displayName || "Unknown Test",
              company: e.testConfig?.companyName || "Unknown Company",
              durationSeconds: e.examConfig
                ? e.examConfig.durationMinutes * 60
                : e.testConfig?.totalDurationSeconds || 0,
              questionCount:
                e.examConfig?.totalQuestions || e.testConfig?.totalQuestions || 0,
              sections: e.examConfig?.sections?.map((s: any) => s.name) || [],
              enrollmentStatus: e.status,
              attemptCount,
              maxAttempts,
              canReattempt,
              isLocked: false,
              hasActiveAttempt,
            };
          })
      : [];

    // Recommended tests (from all active configs not yet enrolled in)
    const enrolledConfigIds = new Set(
      data.enrollments.map((e: any) => e.examConfigId || e.testId),
    );

    const recommendedTests = hasActivePlan
      ? data.upcomingTests
          .filter((t: any) => {
            if (enrolledConfigIds.has(t.id)) return false;
            if (allowedList && !allowedList.includes("all")) {
              return (
                allowedList.includes(t.id) ||
                (t.code && allowedList.includes(t.code)) ||
                (t.name && allowedList.includes(t.name))
              );
            }
            return true;
          })
          .map((t: any) => {
            const sumSectionQuestions =
              t.sections?.reduce(
                (sum: number, s: any) => sum + (s.questionCount || 0),
                0,
              ) || 0;

            const sumSectionMinutes =
              t.sections?.reduce(
                (sum: number, s: any) =>
                  sum +
                  (s.sectionDurationMinutes ||
                    (s.durationSeconds ? Math.floor(s.durationSeconds / 60) : 0) ||
                    0),
                0,
              ) || 0;

            const questionCount =
              sumSectionQuestions > 0 ? sumSectionQuestions : t.totalQuestions || 0;

            const durationMinutes =
              sumSectionMinutes > 0
                ? sumSectionMinutes
                : t.isExam
                  ? t.durationMinutes || 0
                  : t.totalDurationSeconds
                    ? Math.floor(t.totalDurationSeconds / 60)
                    : 0;

            const durationSeconds = durationMinutes * 60;

            const mappedSections =
              t.sections?.map((s: any) => ({
                name: t.isExam ? s.name : s.displayName,
                displayName: t.isExam ? s.name : s.displayName,
                questionCount: s.questionCount || 0,
                durationMinutes:
                  s.sectionDurationMinutes ||
                  (s.durationSeconds ? Math.floor(s.durationSeconds / 60) : 0),
              })) || [];

            const maxAttempts =
              attemptsPerExamOverride ??
              (t.ruleFlags?.maxAttempts ?? 3);

            return {
              configId: t.id,
              name: t.isExam ? t.name : t.displayName,
              company: t.isExam ? "SkillitriX" : t.companyName,
              durationSeconds,
              durationMinutes,
              questionCount,
              sections: mappedSections,
              enrollmentStatus: "AVAILABLE",
              attemptCount: 0,
              maxAttempts,
              canReattempt: true,
              isLocked: false,
              hasActiveAttempt: false,
            };
          })
      : [];

    return {
      upcomingTests,
      completedTests,
      activeAttempts,
      recommendedTests,
    };
  }

  async getDashboardMetrics(userId: string) {
    const data = await this.dashboardRepository.getDashboardData(userId);

    // completedTests maps to data.completedTests
    const completedTests = data.completedTests.map((t: any) => {
      const score =
        t.candidateResult?.score ?? t.evaluationResult?.overallScore ?? 0;
      const percentage =
        t.candidateResult?.percentage ??
        t.evaluationResult?.confidenceScore ??
        score;
      return { score, percentage };
    });

    const bestScore =
      completedTests.length > 0
        ? Math.max(...completedTests.map((t: any) => Math.round(t.percentage)))
        : 0;

    const averageAccuracy =
      completedTests.length > 0
        ? completedTests.reduce(
            (sum: number, t: any) => sum + t.percentage,
            0,
          ) / completedTests.length
        : 0;

    return {
      bestScore,
      averageAccuracy,
      attemptCount: completedTests.length,
    };
  }
}
