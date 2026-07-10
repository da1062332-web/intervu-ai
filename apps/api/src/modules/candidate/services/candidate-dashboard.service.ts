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

    const upcomingTests = data.enrollments
      .filter((e: any) => e.status === "ENROLLED")
      .map((e: any) => ({
        configId: e.examConfigId || e.testId,
        name: e.examConfig?.name || e.testConfig?.displayName || "Unknown Test",
        company: e.testConfig?.companyName || "Unknown Company",
        durationSeconds: e.examConfig ? (e.examConfig.durationMinutes * 60) : (e.testConfig?.totalDurationSeconds || 0),
        questionCount: e.examConfig?.totalQuestions || e.testConfig?.totalQuestions || 0,
        sections: [], // Would fetch sections if needed
        enrollmentStatus: e.status,
      }));

    const completedTests = data.completedTests.map((t: any) => ({
      instanceId: t.id,
      configId: t.examConfigId || t.testConfigId,
      name: t.examConfig?.name || t.testConfig?.displayName || "Unknown Test",
      score: t.evaluationResult?.overallScore || 0,
      submittedAt: t.updatedAt?.toISOString() || null,
    }));

    const activeAttempts = data.activeAttempts.map((t: any) => {
      const totalDuration = t.examConfig ? (t.examConfig.durationMinutes * 60) : (t.testConfig?.totalDurationSeconds || 3600);
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

    const recommendedTests = data.upcomingTests.map((t: any) => ({
      configId: t.id,
      name: t.isExam ? t.name : t.displayName,
      company: t.isExam ? "Intervu" : t.companyName,
      durationSeconds: t.isExam ? t.durationMinutes * 60 : t.totalDurationSeconds,
      questionCount: t.totalQuestions,
      sections: t.isExam ? t.sections?.map((s: any) => s.name) || [] : t.sections?.map((s: any) => s.displayName) || [],
      enrollmentStatus:
        data.enrollments.find((e: any) => e.examConfigId === t.id || e.testId === t.id)?.status ||
        "AVAILABLE",
    }));

    return {
      upcomingTests,
      completedTests,
      activeAttempts,
      recommendedTests,
    };
  }
}
