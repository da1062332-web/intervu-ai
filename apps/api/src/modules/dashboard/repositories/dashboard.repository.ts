import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

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
}
