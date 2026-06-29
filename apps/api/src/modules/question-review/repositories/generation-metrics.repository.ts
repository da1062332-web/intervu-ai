import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma, GenerationMetrics } from "@prisma/client";

@Injectable()
export class GenerationMetricsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateMetrics(
    tx?: Prisma.TransactionClient,
  ): Promise<GenerationMetrics> {
    const client = tx || this.prisma;
    const existing = await client.generationMetrics.findFirst();
    if (existing) {
      return existing;
    }
    return client.generationMetrics.create({
      data: {
        questionsGenerated: 0,
        questionsApproved: 0,
        questionsRejected: 0,
        averageQualityScore: 0,
        averageDifficultyAccuracy: 0,
      },
    });
  }

  async updateMetrics(
    data: Prisma.GenerationMetricsUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<GenerationMetrics> {
    const client = tx || this.prisma;
    const metrics = await this.getOrCreateMetrics(client);
    return client.generationMetrics.update({
      where: { id: metrics.id },
      data,
    });
  }
}
