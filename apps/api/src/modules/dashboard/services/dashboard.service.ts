import { Injectable, NotFoundException } from "@nestjs/common";
import {
  DashboardStats,
  DashboardAnalyticsSummary,
  DashboardActivityItem,
} from "@intervu/shared";
import { UserNotFoundError } from "@intervu/shared";
import { DashboardRepository } from "../repositories/dashboard.repository";
import type { TestWithTemplate } from "../repositories/dashboard.repository";
 
import {
  DashboardResponseDto,
  AvailableTestDto,
  ActiveTestDto,
  CompletedAttemptDto,
  TemplateConfig,
} from "../dto/dashboard-response.dto";

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  // ─── Existing analytics methods (untouched) ──────────────────────────────

  async getStats(userId: string): Promise<DashboardStats> {
    // 1. Validate
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      throw new NotFoundException("User ID is required");
    }

    // 2. Fetch dependencies
    const rawStats = await this.dashboardRepository.getStatsByUserId(userId);

    // 3. Core logic
    const testsTaken = rawStats.testsTaken;
    const totalSessions = rawStats.totalSessions;
    const completionRate =
      totalSessions > 0 ? Math.round((testsTaken / totalSessions) * 100) : 0;
    const averageScore =
      rawStats.averageScore !== null ? Math.round(rawStats.averageScore) : 0;

    // 4. Format response
    return {
      testsTaken,
      averageScore,
      completionRate,
      totalSessions,
    };
  }

  async getAnalyticsSummary(
    userId: string,
  ): Promise<DashboardAnalyticsSummary> {
    // 1. Validate
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      throw new NotFoundException("User ID is required");
    }

    // 2. Fetch dependencies
    const rawSummary =
      await this.dashboardRepository.getAnalyticsSummaryByUserId(userId);

    // 3. Core logic
    const communicationScore =
      rawSummary.communicationScore !== null
        ? Math.round(rawSummary.communicationScore)
        : 0;
    const technicalScore =
      rawSummary.technicalScore !== null
        ? Math.round(rawSummary.technicalScore)
        : 0;
    const confidenceScore =
      rawSummary.confidenceScore !== null
        ? Math.round(rawSummary.confidenceScore)
        : 0;
    const overallRating =
      rawSummary.overallRating !== null
        ? parseFloat(rawSummary.overallRating.toFixed(1))
        : 0.0;

    // 4. Format response
    return {
      communicationScore,
      technicalScore,
      confidenceScore,
      overallRating,
    };
  }

  async getRecentActivity(userId: string): Promise<DashboardActivityItem[]> {
    // 1. Validate
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      throw new NotFoundException("User ID is required");
    }

    // 2. Fetch dependencies
    const rawActivity =
      await this.dashboardRepository.getRecentActivityByUserId(userId, 10);

    // 3. Core logic & 4. Format response
    return rawActivity.map((test) => {
      // CompletedAt is guaranteed non-null from the repository query level
      const completedAtDate = test.completedAt as Date;
      return {
        id: test.id,
        type: "interview_completed" as const,
        title: test.template.name,
        createdAt: completedAtDate.toISOString(),
      };
    });
  }

  // ─── Sprint 2 Day 1 — Candidate dashboard ────────────────────────────────

  /**
   * Assembles the full candidate dashboard in a single service call.
   *
   * Pipeline: validate → fetchDependencies (parallel) → coreLogic → formatResponse
   *
   * Nullable field handling (verified against Prisma schema):
   *   Test.score       Float?    → defaults to 0
   *   Test.startedAt   DateTime? → defaults to null (ISO string)
   *   Test.completedAt DateTime? → defaults to null (ISO string)
   *   Template.config  Json      → cast to TemplateConfig; all keys optional
   */
  async getDashboard(userId: string): Promise<DashboardResponseDto> {
    // 1. Validate
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      throw new UserNotFoundError("userId is required to load the dashboard");
    }

    // 2. fetchDependencies — three parallel DB queries for maximum performance
    const [rawAvailable, rawActive, rawCompleted] = await Promise.all([
      this.dashboardRepository.findAvailableTests(),
      this.dashboardRepository.findActiveTests(userId),
      this.dashboardRepository.findCompletedAttempts(userId),
    ]);

    // 3. coreLogic — capture current timestamp once for all elapsed calculations
    const nowMs = Date.now();

    const availableTests: AvailableTestDto[] = rawAvailable.map((template) => {
      const config = template.config as TemplateConfig;
      return {
        configId: template.id,
        company: config.company ?? "",
        name: template.name,
        difficulty: template.difficulty,
        duration: config.durationSeconds ?? 0,
        sections: config.sections ?? [],
      };
    });

    const activeTests: ActiveTestDto[] = rawActive.map(
      (test: TestWithTemplate) => {
        const config = test.template.config as TemplateConfig;
        const durationSec = config.durationSeconds ?? 0;
        // Test.startedAt is DateTime? — must guard before arithmetic
        const elapsedSec = test.startedAt
          ? Math.floor((nowMs - test.startedAt.getTime()) / 1000)
          : 0;
        return {
          instanceId: test.id,
          configId: test.templateId,
          name: test.template.name,
          startedAt: test.startedAt?.toISOString() ?? null,
          timeRemainingSeconds: Math.max(0, durationSec - elapsedSec),
        };
      },
    );

    const completedAttempts: CompletedAttemptDto[] = rawCompleted.map(
      (test: TestWithTemplate) => ({
        instanceId: test.id,
        configId: test.templateId,
        name: test.template.name,
        // Test.score is Float? — null when evaluation is still pending
        score: test.score ?? 0,
        // Test.completedAt is DateTime? — null is a valid state
        submittedAt: test.completedAt?.toISOString() ?? null,
      }),
    );

    // 4. formatResponse
    return { availableTests, activeTests, completedAttempts };
  }
}
