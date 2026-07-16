import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class CandidateDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData(userId: string) {
    const [activeAttempts, completedTests, enrollments, examConfigs, testConfigs] =
      await Promise.all([
        // Active attempts (IN_PROGRESS or CREATED)
        this.prisma.testInstance.findMany({
          where: {
            userId,
            status: { in: ["IN_PROGRESS", "CREATED"] },
            expiresAt: { gt: new Date() },
          },
          include: {
            testConfig: {
              select: { displayName: true, totalDurationSeconds: true, totalQuestions: true },
            },
            examConfig: {
              select: { name: true, durationMinutes: true, totalQuestions: true },
            },
          },
          orderBy: { createdAt: "desc" },
        }),

        // Completed/submitted tests – keep ALL, including multiple attempts
        this.prisma.testInstance.findMany({
          where: {
            userId,
            status: { in: ["COMPLETED", "SUBMITTED"] },
          },
          include: {
            testConfig: {
              select: { displayName: true },
            },
            examConfig: {
              select: { name: true, durationMinutes: true, totalQuestions: true },
            },
            evaluationResult: {
              select: { overallScore: true },
            },
          },
          orderBy: { createdAt: "desc" },
        }),

        // User's enrollments
        this.prisma.candidateEnrollment.findMany({
          where: { candidateId: userId },
          include: {
            testConfig: {
              select: {
                id: true,
                displayName: true,
                companyName: true,
                totalDurationSeconds: true,
                totalQuestions: true,
              },
            },
            examConfig: {
              select: {
                id: true,
                name: true,
                durationMinutes: true,
                totalQuestions: true,
                sections: { select: { name: true } },
                ruleFlags: { select: { id: true } },
              },
            },
          },
        }),

        // Recommended / available exam configs (limit 10 for dashboard)
        this.prisma.examConfig.findMany({
          where: { isActive: true },
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            sections: { select: { name: true } },
            ruleFlags: { select: { id: true } },
          },
        }),

        // Legacy test configs
        this.prisma.testConfig.findMany({
          where: { isActive: true },
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            sections: { select: { displayName: true } },
          },
        }),
      ]);

    // Build per-config attempt counts for the current user
    const attemptsByConfig = new Map<string, number>();
    completedTests.forEach((t: any) => {
      const configId = t.examConfigId || t.testConfigId;
      if (configId) {
        attemptsByConfig.set(configId, (attemptsByConfig.get(configId) || 0) + 1);
      }
    });

    const upcomingTests = [
      ...examConfigs.map((ec) => ({ ...ec, isExam: true })),
      ...testConfigs.map((tc) => ({ ...tc, isExam: false })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 8);

    return {
      activeAttempts,
      completedTests,
      enrollments, // all enrollments, not filtered
      upcomingTests,
      attemptsByConfig: Object.fromEntries(attemptsByConfig),
    };
  }
}
