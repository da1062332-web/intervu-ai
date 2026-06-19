import { Injectable } from "@nestjs/common";
import { DifficultyDistributionRepository } from "../repositories/difficulty-distribution.repository";
import {
  UpdateDifficultyDistributionDto,
  DifficultyDistributionResponse,
  ConfigNotFoundError,
  BaseError,
} from "@intervu/shared";

@Injectable()
export class DifficultyDistributionService {
  constructor(private readonly repository: DifficultyDistributionRepository) {}

  async getDifficultyDistribution(
    examConfigId: string,
  ): Promise<DifficultyDistributionResponse | null> {
    const configExists = await this.repository.checkConfigExists(examConfigId);
    if (!configExists) {
      throw new ConfigNotFoundError();
    }

    const distribution = await this.repository.findByConfigId(examConfigId);
    if (!distribution) return null;
    return this.mapToResponse(distribution);
  }

  async updateDifficultyDistribution(
    examConfigId: string,
    dto: UpdateDifficultyDistributionDto,
  ): Promise<DifficultyDistributionResponse> {
    const configExists = await this.repository.checkConfigExists(examConfigId);
    if (!configExists) {
      throw new ConfigNotFoundError();
    }

    // Validate business rules
    if (
      dto.easyPercentage < 0 ||
      dto.mediumPercentage < 0 ||
      dto.hardPercentage < 0
    ) {
      throw new BaseError(
        "INVALID_DISTRIBUTION",
        "Percentages cannot be negative",
      );
    }

    if (
      dto.easyPercentage > 100 ||
      dto.mediumPercentage > 100 ||
      dto.hardPercentage > 100
    ) {
      throw new BaseError(
        "INVALID_DISTRIBUTION",
        "Percentages cannot be greater than 100",
      );
    }

    const total = dto.easyPercentage + dto.mediumPercentage + dto.hardPercentage;
    if (total !== 100) {
      throw new BaseError(
        "INVALID_DISTRIBUTION_TOTAL",
        "Difficulty distribution total must be exactly 100%",
      );
    }

    const distribution = await this.repository.upsert(examConfigId, {
      easyPercentage: dto.easyPercentage,
      mediumPercentage: dto.mediumPercentage,
      hardPercentage: dto.hardPercentage,
    });

    return this.mapToResponse(distribution);
  }

  private mapToResponse(distribution: {
    id: string;
    examConfigId: string;
    easyPercentage: number;
    mediumPercentage: number;
    hardPercentage: number;
    createdAt: Date;
    updatedAt: Date;
  }): DifficultyDistributionResponse {
    return {
      id: distribution.id,
      examConfigId: distribution.examConfigId,
      easyPercentage: distribution.easyPercentage,
      mediumPercentage: distribution.mediumPercentage,
      hardPercentage: distribution.hardPercentage,
      createdAt: distribution.createdAt,
      updatedAt: distribution.updatedAt,
    };
  }
}
