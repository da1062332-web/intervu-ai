import { Injectable } from "@nestjs/common";
import { Template, Test } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";

/**
 * Typed result for queries that join Test → Template.
 * Prisma's `include` does not alter the base Test type at compile time when
 * accessed via a plain repository, so we declare the intersection explicitly.
 */
export type TestWithTemplate = Test & { template: Template };

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Existing analytics methods (untouched) ────────────────────────────────

  async getStatsByUserId(userId: string) {
    const [testsTaken, totalSessions, scoreAgg] = await Promise.all([
      this.prisma.test.count({
        where: {
          userId,
          status: { in: ["COMPLETED", "EVALUATED"] },
          deletedAt: null,
        },
      }),
      this.prisma.test.count({
        where: {
          userId,
          deletedAt: null,
        },
      }),
      this.prisma.test.aggregate({
        where: {
          userId,
          deletedAt: null,
          score: { not: null },
        },
        _avg: {
          score: true,
        },
      }),
    ]);

    return {
      testsTaken,
      totalSessions,
      averageScore: scoreAgg._avg.score,
    };
  }

  async getAnalyticsSummaryByUserId(userId: string) {
    const agg = await this.prisma.evaluationResult.aggregate({
      where: {
        userId,
      },
      _avg: {
        communicationScore: true,
        technicalScore: true,
        confidenceScore: true,
        overallRating: true,
      },
    });

    return {
      communicationScore: agg._avg.communicationScore,
      technicalScore: agg._avg.technicalScore,
      confidenceScore: agg._avg.confidenceScore,
      overallRating: agg._avg.overallRating,
    };
  }

  async getRecentActivityByUserId(userId: string, limit: number) {
    return this.prisma.test.findMany({
      where: {
        userId,
        status: { in: ["COMPLETED", "EVALUATED"] },
        completedAt: { not: null },
        deletedAt: null,
      },
      orderBy: {
        completedAt: "desc",
      },
      take: limit,
      include: {
        template: {
          select: {
            name: true,
          },
        },
      },
    });
  }

  // ─── Sprint 2 Day 1 — Candidate dashboard methods ──────────────────────────

  /**
   * Returns all non-deleted templates.
   * "Available tests" are templates a candidate has not yet started.
   * Filtering by user (to exclude already-started) is the service's responsibility.
   */
  async findAvailableTests(): Promise<Template[]> {
    return this.prisma.template.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Returns all ONGOING test instances for the given user joined with their template.
   * Schema note: TestStatus.ONGOING maps to the sprint's "IN_PROGRESS" concept.
   */
  async findActiveTests(userId: string): Promise<TestWithTemplate[]> {
    return this.prisma.test.findMany({
      where: {
        userId,
        status: "ONGOING",
        deletedAt: null,
      },
      include: { template: true },
    }) as Promise<TestWithTemplate[]>;
  }

  /**
   * Returns the 10 most recently completed (COMPLETED or EVALUATED) test instances
   * for the given user, joined with their template.
   * Sorted by completedAt DESC — schema field is DateTime? (nullable).
   */
  async findCompletedAttempts(userId: string): Promise<TestWithTemplate[]> {
    return this.prisma.test.findMany({
      where: {
        userId,
        status: { in: ["COMPLETED", "EVALUATED"] },
        deletedAt: null,
      },
      orderBy: { completedAt: "desc" },
      take: 10,
      include: { template: true },
    }) as Promise<TestWithTemplate[]>;
  }
}
