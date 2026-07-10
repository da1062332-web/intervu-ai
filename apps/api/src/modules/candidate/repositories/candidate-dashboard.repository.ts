import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class CandidateDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData(userId: string) {
    const [activeAttempts, completedTests, enrollments, examConfigs, testConfigs] =
      await Promise.all([
        // Active attempts (IN_PROGRESS)
        this.prisma.testInstance.findMany({
          where: {
            userId,
            status: "IN_PROGRESS",
          },
          include: {
            testConfig: {
              select: { displayName: true },
            },
            examConfig: {
              select: { name: true },
            }
          },
        }),

        // Completed tests (COMPLETED/SUBMITTED)
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
              select: { name: true },
            },
            evaluationResult: {
              select: { overallScore: true },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5,
        }),

        // User's enrollments to map status
        this.prisma.candidateEnrollment.findMany({
          where: { candidateId: userId },
          include: {
            testConfig: {
              select: {
                displayName: true,
                companyName: true,
                totalDurationSeconds: true,
                totalQuestions: true,
              },
            },
            examConfig: {
              select: {
                name: true,
                durationMinutes: true,
                totalQuestions: true,
              }
            }
          },
        }),

        // Recommended / available tests (limit 5 for dashboard)
        this.prisma.examConfig.findMany({
          where: { isActive: true },
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            sections: {
              select: { name: true },
            },
          },
        }),
        this.prisma.testConfig.findMany({
          where: { isActive: true },
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            sections: {
              select: { displayName: true },
            },
          },
        }),
      ]);

    const upcomingTests = [
      ...examConfigs.map(ec => ({ ...ec, isExam: true })),
      ...testConfigs.map(tc => ({ ...tc, isExam: false }))
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);

    return { activeAttempts, completedTests, enrollments, upcomingTests };
  }
}
