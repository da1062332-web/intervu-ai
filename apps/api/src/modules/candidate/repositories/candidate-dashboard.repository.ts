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
      ] = await Promise.all([
        // Active attempts (IN_PROGRESS or CREATED)
        this.prisma.testInstance.findMany({
          where: {
            userId,
            status: { in: ["IN_PROGRESS", "CREATED"] },
            expiresAt: { gt: new Date() },
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
          take: 50, // PERF-001: Dashboard only needs recent history; full history is paginated elsewhere
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
          take: 20, // PERF-001: Dashboard enrollment list is capped
        }),

        this.getCachedExamConfigs(),
      ]);

      const now = new Date();
      const overrides = await this.prisma.userQuotaOverride.findMany({
        where: {
          userId,
          featureKey: { in: ["allowed_assessments", "allowedAssessments"] },
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      });

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

      const allUserInstances = await this.prisma.testInstance.findMany({
        where: { userId },
        select: { examConfigId: true, testConfigId: true },
      });

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
    const key = "dashboard:examConfigs:available:v8";
    let data = await this.cacheService.get<any>(key);
    if (!data) {
      data = await this.prisma.examConfig.findMany({
        where: { isArchived: false, isActive: true, status: { in: ["PUBLISHED", "ACTIVE", "VALIDATED"] } },
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
      await this.cacheService.set(key, data, { ttl: 60 });
    }
    return data;
  }


}
