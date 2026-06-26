import { Injectable } from "@nestjs/common";
import { GenerationMetricsRepository } from "../repositories/generation-metrics.repository";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class GenerationMonitorService {
  constructor(
    private readonly metricsRepo: GenerationMetricsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async recordGeneration(count = 1): Promise<void> {
    const metrics = await this.metricsRepo.getOrCreateMetrics();
    await this.metricsRepo.updateMetrics({
      questionsGenerated: { increment: count },
    });
  }

  async recordReview(params: {
    score: number;
    difficultyMatched: boolean;
    recommendation: "APPROVE" | "REVIEW" | "REJECT";
  }): Promise<void> {
    const metrics = await this.metricsRepo.getOrCreateMetrics();
    
    // Count total review audit logs to compute new moving averages
    const totalReviewed = await this.prisma.reviewAuditLog.count();

    const isApproved = params.recommendation === "APPROVE";
    const isRejected = params.recommendation === "REJECT";

    const oldAvgScore = metrics.averageQualityScore;
    const oldAvgDiffAcc = metrics.averageDifficultyAccuracy;

    // Calculate new moving averages (convert difficultyMatched to 0 or 100 percentage)
    const matchVal = params.difficultyMatched ? 100 : 0;
    
    const newAvgScore = totalReviewed === 0
      ? params.score
      : ((oldAvgScore * totalReviewed) + params.score) / (totalReviewed + 1);

    const newAvgDiffAcc = totalReviewed === 0
      ? matchVal
      : ((oldAvgDiffAcc * totalReviewed) + matchVal) / (totalReviewed + 1);

    await this.metricsRepo.updateMetrics({
      questionsApproved: isApproved ? { increment: 1 } : undefined,
      questionsRejected: isRejected ? { increment: 1 } : undefined,
      averageQualityScore: newAvgScore,
      averageDifficultyAccuracy: newAvgDiffAcc,
    });
  }

  async getMetrics() {
    return this.metricsRepo.getOrCreateMetrics();
  }
}
