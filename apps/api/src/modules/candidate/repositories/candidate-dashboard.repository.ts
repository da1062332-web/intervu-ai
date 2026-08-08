import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { RedisCacheService } from "../../../cache/redis-cache.service";

@Injectable()
export class CandidateDashboardRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: RedisCacheService,
  ) {}

  async getDashboardData(userId: string) {
    try {
      const [
        activeAttempts,
        completedTests,
        enrollments,
        examConfigs,
        testConfigs,
      ] = await Promise.all([
        // Active attempts (IN_PROGRESS or CREATED)
        this.prisma.testInstance.findMany({
          where: {
            userId,
            status: { in: ["IN_PROGRESS", "CREATED"] },
            expiresAt: { gt: new Date() },
          },
          include: {
            testConfig: {
              select: { displayName: true, totalDurationSeconds: true },
            },
            examConfig: {
              select: {
                name: true,
                durationMinutes: true,
                totalQuestions: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),

        // Completed/submitted tests – PERF-001: limit to 50 most recent to avoid unbounded query
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
              select: {
                name: true,
                durationMinutes: true,
                totalQuestions: true,
              },
            },
            evaluationResult: {
              select: { overallScore: true, confidenceScore: true },
            },
            candidateResult: {
              select: { score: true, percentage: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50, // PERF-001: Dashboard only needs recent history; full history is paginated elsewhere
        }),

        // User's enrollments – PERF-001: limit to 20 most recent
        this.prisma.candidateEnrollment.findMany({
          where: { candidateId: userId },
          include: {
            testConfig: {
              select: {
                id: true,
                displayName: true,
                companyName: true,
                totalDurationSeconds: true,
              },
            },
            examConfig: {
              select: {
                id: true,
                name: true,
                durationMinutes: true,
                totalQuestions: true,
                sections: { select: { name: true } },
                ruleFlags: { select: { id: true, maxAttempts: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20, // PERF-001: Dashboard enrollment list is capped
        }),

        this.getCachedExamConfigs(),
        this.getCachedTestConfigs(),
      ]);

      // Build per-config attempt counts for the current user
      const attemptsByConfig = new Map<string, number>();
      completedTests.forEach((t: any) => {
        const configId = t.examConfigId || t.testConfigId;
        if (configId) {
          attemptsByConfig.set(
            configId,
            (attemptsByConfig.get(configId) || 0) + 1,
          );
        }
      });

      const upcomingTests = [
        ...examConfigs.map((ec: any) => ({
          ...ec,
          isExam: true,
          createdAt: new Date(ec.createdAt),
        })),
        ...testConfigs.map((tc: any) => ({
          ...tc,
          isExam: false,
          createdAt: new Date(tc.createdAt),
        })),
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
    } catch (error) {
      console.error(
        "[CandidateDashboardRepository] Database connection error:",
        error,
      );
      return {
        activeAttempts: [],
        completedTests: [],
        enrollments: [],
        upcomingTests: [],
        attemptsByConfig: {},
      };
    }
  }

  private async getCachedExamConfigs() {
    const key = "dashboard:examConfigs:available";
    let data = await this.cacheService.get<any>(key);
    if (!data) {
      data = await this.prisma.examConfig.findMany({
        where: { isActive: true },
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          durationMinutes: true,
          totalQuestions: true,
          sections: {
            select: {
              name: true,
              questionCount: true,
              sectionDurationMinutes: true,
            },
          },
          ruleFlags: { select: { id: true, maxAttempts: true } },
          createdAt: true,
        },
      });
      await this.cacheService.set(key, data, { ttl: 300 });
    }
    return data;
  }

  private async getCachedTestConfigs() {
    const key = "dashboard:testConfigs:available";
    let data = await this.cacheService.get<any>(key);
    if (!data) {
      data = await this.prisma.testConfig.findMany({
        where: { isActive: true },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          displayName: true,
          companyName: true,
          totalDurationSeconds: true,
          totalQuestions: true,
          sections: {
            select: {
              displayName: true,
              questionCount: true,
              durationSeconds: true,
            },
          },
          createdAt: true,
        },
      });
      await this.cacheService.set(key, data, { ttl: 300 });
    }
    return data;
  }
}
