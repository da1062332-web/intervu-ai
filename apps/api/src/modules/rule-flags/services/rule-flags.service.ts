import { Injectable } from "@nestjs/common";
import { RuleFlagsRepository } from "../repositories/rule-flags.repository";
import {
  UpdateRuleFlags,
  RuleFlagsResponseDto,
  ConfigNotFoundError,
  RuleCombinationError,
} from "@intervu/shared";
import { ExamRuleFlags } from "@prisma/client";

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
        randomizeQuestions: false,
        randomizeOptions: false,
        calculatorAllowed: false,
        sectionLockingEnabled: false,
        freeNavigationEnabled: true,
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

    // Validate Business Rules
    if (data.sectionLockingEnabled && data.freeNavigationEnabled) {
      throw new RuleCombinationError();
    }

    const updated = await this.repository.upsert(configId, data);
    return this.mapToResponse(updated);
  }

  private mapToResponse(entity: ExamRuleFlags): RuleFlagsResponseDto {
    return {
      id: entity.id,
      examConfigId: entity.examConfigId,
      negativeMarkingEnabled: entity.negativeMarkingEnabled,
      randomizeQuestions: entity.randomizeQuestions,
      randomizeOptions: entity.randomizeOptions,
      calculatorAllowed: entity.calculatorAllowed,
      sectionLockingEnabled: entity.sectionLockingEnabled,
      freeNavigationEnabled: entity.freeNavigationEnabled,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
