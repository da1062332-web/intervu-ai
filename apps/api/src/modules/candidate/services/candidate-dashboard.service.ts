import { Injectable } from "@nestjs/common";
import { CandidateDashboardRepository } from "../repositories/candidate-dashboard.repository";
import { CandidateDashboardResponseDto } from "../dto/candidate-dashboard.dto";

@Injectable()
export class CandidateDashboardService {
  constructor(
    private readonly dashboardRepository: CandidateDashboardRepository,
  ) {}

  async getDashboardData(
    userId: string,
  ): Promise<CandidateDashboardResponseDto> {
    const data = await this.dashboardRepository.getDashboardData(userId);
    const attemptsByConfig: Record<string, number> = (data as any).attemptsByConfig || {};

    // Active / in-progress tests
    const activeAttempts = data.activeAttempts.map((t: any) => {
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
    });

    // Completed tests – every attempt, newest first
    const completedTests = data.completedTests.map((t: any) => ({
      instanceId: t.id,
      configId: t.examConfigId || t.testConfigId,
      name: t.examConfig?.name || t.testConfig?.displayName || "Unknown Test",
      score: Math.round(
        t.candidateResult?.percentage ??
        t.evaluationResult?.confidenceScore ??
        t.evaluationResult?.overallScore ?? 0
      ),
      submittedAt: t.updatedAt?.toISOString() || null,
    }));

    // Enrollments → "upcoming" (not started or re-attemptable)
    const upcomingTests = data.enrollments.map((e: any) => {
      const configId = e.examConfigId || e.testId;
      const attemptCount = attemptsByConfig[configId] || 0;
      const maxAttempts = e.examConfig?.ruleFlags?.maxAttempts ?? 3;
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
        questionCount: e.examConfig?.totalQuestions || e.testConfig?.totalQuestions || 0,
        sections: e.examConfig?.sections?.map((s: any) => s.name) || [],
        enrollmentStatus: e.status,
        attemptCount,
        maxAttempts,
        canReattempt,
        hasActiveAttempt,
      };
    });

    // Recommended tests (from all active configs not yet enrolled in)
    const enrolledConfigIds = new Set(
      data.enrollments.map((e: any) => e.examConfigId || e.testId),
    );

    const recommendedTests = data.upcomingTests
      .filter((t: any) => !enrolledConfigIds.has(t.id))
      .map((t: any) => ({
        configId: t.id,
        name: t.isExam ? t.name : t.displayName,
        company: t.isExam ? "Intervu" : t.companyName,
        durationSeconds: t.isExam ? t.durationMinutes * 60 : t.totalDurationSeconds,
        questionCount: t.totalQuestions,
        sections: t.isExam
          ? t.sections?.map((s: any) => s.name) || []
          : t.sections?.map((s: any) => s.displayName) || [],
        enrollmentStatus: "AVAILABLE",
        attemptCount: 0,
        maxAttempts: t.ruleFlags?.maxAttempts ?? 3,
        canReattempt: true,
        hasActiveAttempt: false,
      }));

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
      const score = t.candidateResult?.score ?? t.evaluationResult?.overallScore ?? 0;
      const percentage = t.candidateResult?.percentage ?? t.evaluationResult?.confidenceScore ?? score;
      return { score, percentage };
    });

    const bestScore = completedTests.length > 0 
      ? Math.max(...completedTests.map((t: any) => Math.round(t.percentage))) 
      : 0;
      
    const averageAccuracy = completedTests.length > 0
      ? completedTests.reduce((sum: number, t: any) => sum + t.percentage, 0) / completedTests.length
      : 0;

    return {
      bestScore,
      averageAccuracy,
      attemptCount: completedTests.length,
    };
  }
}
