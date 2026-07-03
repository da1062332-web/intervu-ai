import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class CandidateDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData(userId: string) {
    const [activeAttempts, completedTests, enrollments, upcomingTests] =
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
          },
        }),

        // Recommended / available tests (limit 5 for dashboard)
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

    return { activeAttempts, completedTests, enrollments, upcomingTests };
  }
}
