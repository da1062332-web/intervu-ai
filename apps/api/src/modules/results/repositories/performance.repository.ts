import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class PerformanceRepository {
  constructor(protected readonly prisma: PrismaService) {}

  async getAggregatedPerformance(userId: string) {
    const aggregate = await this.prisma.evaluationResult.aggregate({
      where: { userId },
      _count: {
        id: true,
      },
      _avg: {
        overallScore: true,
      },
      _max: {
        overallScore: true,
      },
    });

    const lastAssessment = await this.prisma.evaluationResult.findFirst({
      where: { userId },
      orderBy: { evaluatedAt: "desc" },
      select: { evaluatedAt: true },
    });

    return {
      testsCompleted: aggregate._count.id,
      averageScore: aggregate._avg.overallScore || 0,
      bestScore: aggregate._max.overallScore || 0,
      lastAssessmentDate: lastAssessment?.evaluatedAt || null,
    };
  }

  async findLastActivity(): Promise<Date | null> {
    const last = await this.prisma.performanceSummary.findFirst({
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });
    return last?.updatedAt || null;
  }
}
