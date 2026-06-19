import { Injectable } from "@nestjs/common";
import { RuleFlagsRepository } from "../repositories/rule-flags.repository";
import {
  UpdateRuleFlags,
  RuleFlagsResponseDto,
  ConfigNotFoundError,
} from "@intervu/shared";
import { RuleFlags } from "@prisma/client";

@Injectable()
export class RuleFlagsService {
  constructor(private readonly repository: RuleFlagsRepository) {}

  async getRuleFlags(configId: string): Promise<RuleFlagsResponseDto> {
    const configExists = await this.repository.checkConfigExists(configId);
    if (!configExists) {
      throw new ConfigNotFoundError();
    }

    const ruleFlags = await this.repository.findByConfigId(configId);

    if (!ruleFlags) {
      // Return defaults if none exist yet, matching DB schema
      return {
        id: "", // Will be assigned on creation
        examConfigId: configId,
        negativeMarkingEnabled: false,
        sectionalCutoffEnabled: false,
        adaptiveDifficultyEnabled: false,
        shuffleQuestionsEnabled: false,
        shuffleOptionsEnabled: false,
        allowSectionNavigation: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return this.mapToResponse(ruleFlags);
  }

  async updateRuleFlags(
    configId: string,
    data: UpdateRuleFlags,
  ): Promise<RuleFlagsResponseDto> {
    const configExists = await this.repository.checkConfigExists(configId);
    if (!configExists) {
      throw new ConfigNotFoundError();
    }

    const updated = await this.repository.upsert(configId, data);
    return this.mapToResponse(updated);
  }

  private mapToResponse(entity: RuleFlags): RuleFlagsResponseDto {
    return {
      id: entity.id,
      examConfigId: entity.examConfigId,
      negativeMarkingEnabled: entity.negativeMarkingEnabled,
      sectionalCutoffEnabled: entity.sectionalCutoffEnabled,
      adaptiveDifficultyEnabled: entity.adaptiveDifficultyEnabled,
      shuffleQuestionsEnabled: entity.shuffleQuestionsEnabled,
      shuffleOptionsEnabled: entity.shuffleOptionsEnabled,
      allowSectionNavigation: entity.allowSectionNavigation,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
