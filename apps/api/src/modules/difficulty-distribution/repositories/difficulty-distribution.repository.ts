import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { DifficultyDistribution } from "@prisma/client";

@Injectable()
export class DifficultyDistributionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByConfigId(
    examConfigId: string,
  ): Promise<DifficultyDistribution | null> {
    return this.prisma.difficultyDistribution.findUnique({
      where: { examConfigId },
    });
  }

  async create(
    examConfigId: string,
    data: {
      easyPercentage: number;
      mediumPercentage: number;
      hardPercentage: number;
    },
  ): Promise<DifficultyDistribution> {
    return this.prisma.difficultyDistribution.create({
      data: {
        examConfigId,
        easyPercentage: data.easyPercentage,
        mediumPercentage: data.mediumPercentage,
        hardPercentage: data.hardPercentage,
      },
    });
  }

  async update(
    examConfigId: string,
    data: {
      easyPercentage: number;
      mediumPercentage: number;
      hardPercentage: number;
    },
  ): Promise<DifficultyDistribution> {
    return this.prisma.difficultyDistribution.update({
      where: { examConfigId },
      data: {
        easyPercentage: data.easyPercentage,
        mediumPercentage: data.mediumPercentage,
        hardPercentage: data.hardPercentage,
      },
    });
  }

  async upsert(
    examConfigId: string,
    data: {
      easyPercentage: number;
      mediumPercentage: number;
      hardPercentage: number;
    },
  ): Promise<DifficultyDistribution> {
    const existing = await this.findByConfigId(examConfigId);
    if (existing) {
      return this.update(examConfigId, data);
    }
    return this.create(examConfigId, data);
  }

  async checkConfigExists(examConfigId: string): Promise<boolean> {
    const count = await this.prisma.examConfig.count({
      where: { id: examConfigId },
    });
    return count > 0;
  }
}
