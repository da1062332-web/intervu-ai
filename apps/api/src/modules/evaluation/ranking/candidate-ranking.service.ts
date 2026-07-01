import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CandidateResultDto } from "@intervu-ai/contracts";

export interface CandidateRankResponseDto {
  rank: number;
  totalCandidates: number;
  percentile: number;
  assessment: {
    rank: number;
    totalCandidates: number;
    percentile: number;
  };
  organization: {
    rank: number;
    totalCandidates: number;
    percentile: number;
  };
  batch: {
    rank: number;
    totalCandidates: number;
    percentile: number;
  };
}

@Injectable()
export class CandidateRankingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Computes the candidate's rank across different cohorts.
   */
  async calculateRanking(result: CandidateResultDto): Promise<CandidateRankResponseDto> {
    const { attemptId, percentage } = result;

    // Fetch the test instance details
    const testInstance = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
      include: { testConfig: true },
    });

    if (!testInstance) {
      throw new NotFoundException(`Attempt ${attemptId} not found`);
    }

    const { testConfig, submittedAt } = testInstance;
    const submissionDate = submittedAt || new Date();

    // Define Cohort Filters
    // 1. Assessment (Same testConfigId)
    const assessmentWhere = {
      attempt: {
        testConfigId: testInstance.testConfigId,
      },
    };

    // 2. Organization (Same companyName in TestConfig)
    const orgWhere = {
      attempt: {
        testConfig: {
          companyName: testConfig.companyName,
        },
      },
    };

    // 3. Batch (Same testConfigId and submitted within the same calendar month)
    const startOfMonth = new Date(submissionDate.getFullYear(), submissionDate.getMonth(), 1);
    const endOfMonth = new Date(submissionDate.getFullYear(), submissionDate.getMonth() + 1, 0, 23, 59, 59, 999);
    const batchWhere = {
      attempt: {
        testConfigId: testInstance.testConfigId,
        submittedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    };

    // Calculate rankings
    const assessmentCohort = await this.computeCohortRank(percentage, assessmentWhere);
    const orgCohort = await this.computeCohortRank(percentage, orgWhere);
    const batchCohort = await this.computeCohortRank(percentage, batchWhere);

    return {
      rank: assessmentCohort.rank,
      totalCandidates: assessmentCohort.totalCandidates,
      percentile: parseFloat(assessmentCohort.percentile.toFixed(2)),
      assessment: {
        rank: assessmentCohort.rank,
        totalCandidates: assessmentCohort.totalCandidates,
        percentile: parseFloat(assessmentCohort.percentile.toFixed(2)),
      },
      organization: {
        rank: orgCohort.rank,
        totalCandidates: orgCohort.totalCandidates,
        percentile: parseFloat(orgCohort.percentile.toFixed(2)),
      },
      batch: {
        rank: batchCohort.rank,
        totalCandidates: batchCohort.totalCandidates,
        percentile: parseFloat(batchCohort.percentile.toFixed(2)),
      },
    };
  }

  /**
   * Helper to execute count queries for ranking and percentile within a specific cohort filter
   */
  private async computeCohortRank(
    percentage: number,
    whereClause: any,
  ): Promise<{ rank: number; totalCandidates: number; percentile: number }> {
    const total = await this.prisma.candidateResult.count({ where: whereClause });
    
    const countHigher = await this.prisma.candidateResult.count({
      where: {
        ...whereClause,
        percentage: { gt: percentage },
      },
    });

    const countEqual = await this.prisma.candidateResult.count({
      where: {
        ...whereClause,
        percentage: percentage,
      },
    });

    const rank = countHigher + 1;
    const countLess = total - countHigher - countEqual;
    
    // Percentile using standard formula
    const percentile = total > 0 
      ? ((countLess + 0.5 * countEqual) / total) * 100 
      : 100.0;

    return {
      rank,
      totalCandidates: total,
      percentile,
    };
  }
}
