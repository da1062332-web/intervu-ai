import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { RedisCacheService } from "../../../cache/redis-cache.service";

@Injectable()
export class CandidateDashboardRepository {
  private static examConfigsMemCache: { data: any; expiresAt: number } | null = null;
  private static dashboardMemCache = new Map<string, { data: any; expiresAt: number }>();
  private static inFlightRequests = new Map<string, Promise<any>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: RedisCacheService,
  ) {}

  async getDashboardData(userId: string) {
    const now = Date.now();
    const cached = CandidateDashboardRepository.dashboardMemCache.get(userId);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }

    const inFlight = CandidateDashboardRepository.inFlightRequests.get(userId);
    if (inFlight) {
      return inFlight;
    }

    const promise = this.fetchDashboardData(userId);
    CandidateDashboardRepository.inFlightRequests.set(userId, promise);

    try {
      const data = await promise;
      CandidateDashboardRepository.dashboardMemCache.set(userId, {
        data,
        expiresAt: Date.now() + 30 * 1000, // 30s TTL
      });
      return data;
    } finally {
      CandidateDashboardRepository.inFlightRequests.delete(userId);
    }
  }

  private async fetchDashboardData(userId: string) {
    try {
      const now = new Date();
      const [
        activeAttempts,
        completedTests,
        enrollments,
        examConfigs,
        allUserInstances,
        overrides,
      ] = await Promise.all([
        // Active attempts (IN_PROGRESS or CREATED)
        this.prisma.testInstance.findMany({
          where: {
            userId,
            status: { in: ["IN_PROGRESS", "CREATED"] },
            expiresAt: { gt: now },
            examConfig: {
              status: { in: ["PUBLISHED", "ACTIVE", "VALIDATED"] },
              isActive: true,
              isArchived: false,
            },
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
                id: true,
                code: true,
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
          take: 50,
        }),

        // User's enrollments – PERF-001: limit to 20 most recent
        this.prisma.candidateEnrollment.findMany({
          where: {
            candidateId: userId,
            examConfig: {
              status: { in: ["PUBLISHED", "ACTIVE", "VALIDATED"] },
              isActive: true,
              isArchived: false,
            },
          },
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
                code: true,
                name: true,
                durationMinutes: true,
                totalQuestions: true,
                sections: { select: { name: true } },
                ruleFlags: { select: { id: true, maxAttempts: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),

        this.getCachedExamConfigs(),

        this.prisma.testInstance.findMany({
          where: { userId },
          select: { examConfigId: true, testConfigId: true },
        }),

        this.prisma.userQuotaOverride.findMany({
          where: {
            userId,
            featureKey: { in: ["allowed_assessments", "allowedAssessments"] },
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        }),
      ]);

      const explicitCodes: string[] = [];
      for (const ov of overrides) {
        const val = ov.overrideValue as any;
        const list = Array.isArray(val)
          ? val
          : Array.isArray(val?.assessments)
            ? val.assessments
            : [];
        for (const item of list) {
          if (typeof item === "string" && item.trim()) {
            explicitCodes.push(item.trim());
          }
        }
      }

      let extraExamConfigs: any[] = [];
      if (explicitCodes.length > 0) {
        const missingCodes = explicitCodes.filter(
          (c) => !examConfigs.some((ec: any) => ec.id === c || ec.code === c),
        );
        if (missingCodes.length > 0) {
          extraExamConfigs = await this.prisma.examConfig.findMany({
            where: {
              isArchived: false,
              OR: [
                { id: { in: missingCodes } },
                { code: { in: missingCodes } },
              ],
            },
            select: {
              id: true,
              code: true,
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
        }
      }

      const combinedExamConfigs = [...examConfigs, ...extraExamConfigs];

      // Build per-config attempt counts for the current user
      const attemptsByConfig = new Map<string, number>();
      allUserInstances.forEach((t: any) => {
        const configId = t.examConfigId || t.testConfigId;
        if (configId) {
          attemptsByConfig.set(
            configId,
            (attemptsByConfig.get(configId) || 0) + 1,
          );
        }
      });

      const upcomingTests = combinedExamConfigs
        .map((ec: any) => ({
          ...ec,
          isExam: true,
          createdAt: new Date(ec.createdAt),
        }))
        .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());

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
    const now = Date.now();
    if (
      CandidateDashboardRepository.examConfigsMemCache &&
      CandidateDashboardRepository.examConfigsMemCache.expiresAt > now
    ) {
      return CandidateDashboardRepository.examConfigsMemCache.data;
    }

    const key = "dashboard:examConfigs:available:v9";
    let data: any = null;
    try {
      data = await this.cacheService.get<any>(key);
    } catch {}

    if (!data) {
      data = await this.prisma.examConfig.findMany({
        where: { isArchived: false, isActive: true, status: { in: ["PUBLISHED", "ACTIVE"] } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          code: true,
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
      try {
        await this.cacheService.set(key, data, { ttl: 120 });
      } catch {}
    }

    CandidateDashboardRepository.examConfigsMemCache = {
      data,
      expiresAt: now + 120 * 1000, // 2 minutes in-memory cache
    };
    return data;
  }
}
