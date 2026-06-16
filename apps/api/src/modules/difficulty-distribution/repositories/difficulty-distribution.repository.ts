import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DifficultyDistribution } from '@prisma/client';

@Injectable()
export class DifficultyDistributionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByConfigId(examConfigId: string): Promise<DifficultyDistribution | null> {
    return this.prisma.difficultyDistribution.findUnique({
      where: { examConfigId },
    });
  }

  async create(examConfigId: string, data: { easyCount: number; mediumCount: number; hardCount: number; totalQuestions: number }): Promise<DifficultyDistribution> {
    return this.prisma.difficultyDistribution.create({
      data: {
        examConfigId,
        easyCount: data.easyCount,
        mediumCount: data.mediumCount,
        hardCount: data.hardCount,
        totalQuestions: data.totalQuestions,
      },
    });
  }

  async update(examConfigId: string, data: { easyCount: number; mediumCount: number; hardCount: number; totalQuestions: number }): Promise<DifficultyDistribution> {
    return this.prisma.difficultyDistribution.update({
      where: { examConfigId },
      data: {
        easyCount: data.easyCount,
        mediumCount: data.mediumCount,
        hardCount: data.hardCount,
        totalQuestions: data.totalQuestions,
      },
    });
  }

  async upsert(examConfigId: string, data: { easyCount: number; mediumCount: number; hardCount: number; totalQuestions: number }): Promise<DifficultyDistribution> {
    const existing = await this.findByConfigId(examConfigId);
    if (existing) {
      return this.update(examConfigId, data);
    }
    return this.create(examConfigId, data);
  }
}
