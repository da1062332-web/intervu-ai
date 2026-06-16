import { Injectable, BadRequestException } from "@nestjs/common";
import { DifficultyDistributionRepository } from "../repositories/difficulty-distribution.repository";
import {
  UpdateDifficultyDistributionDto,
  DifficultyDistributionResponse,
} from "@intervu/shared";

@Injectable()
export class DifficultyDistributionService {
  constructor(private readonly repository: DifficultyDistributionRepository) {}

  async getDifficultyDistribution(
    examConfigId: string,
  ): Promise<DifficultyDistributionResponse | null> {
    const distribution = await this.repository.findByConfigId(examConfigId);
    if (!distribution) return null;
    return this.mapToResponse(distribution);
  }

  async updateDifficultyDistribution(
    examConfigId: string,
    dto: UpdateDifficultyDistributionDto,
  ): Promise<DifficultyDistributionResponse> {
    // Validate business rules
    if (dto.easyCount < 0 || dto.mediumCount < 0 || dto.hardCount < 0) {
      throw new BadRequestException({
        code: "INVALID_DISTRIBUTION",
        message: "Question counts cannot be negative",
      });
    }

    const total = dto.easyCount + dto.mediumCount + dto.hardCount;
    if (total <= 0) {
      throw new BadRequestException({
        code: "INVALID_DISTRIBUTION",
        message: "At least one question must exist.",
      });
    }

    const distribution = await this.repository.upsert(examConfigId, {
      easyCount: dto.easyCount,
      mediumCount: dto.mediumCount,
      hardCount: dto.hardCount,
      totalQuestions: total,
    });

    return this.mapToResponse(distribution);
  }

  private mapToResponse(distribution: {
    id: string;
    examConfigId: string;
    easyCount: number;
    mediumCount: number;
    hardCount: number;
    totalQuestions: number;
    createdAt: Date;
    updatedAt: Date;
  }): DifficultyDistributionResponse {
    return {
      id: distribution.id,
      examConfigId: distribution.examConfigId,
      easyCount: distribution.easyCount,
      mediumCount: distribution.mediumCount,
      hardCount: distribution.hardCount,
      totalQuestions: distribution.totalQuestions,
      createdAt: distribution.createdAt,
      updatedAt: distribution.updatedAt,
    };
  }
}
