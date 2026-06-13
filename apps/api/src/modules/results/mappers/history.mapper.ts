import { HistoryItemResponseDto } from "@intervu/shared";

import { EvaluationResult } from "@prisma/client";

export class HistoryMapper {
  static toDto(entity: EvaluationResult): HistoryItemResponseDto {
    return {
      evaluationId: entity.id,
      testId: entity.testId,
      testInstanceId: entity.testInstanceId,
      overallScore: entity.overallScore,
      evaluatedAt: entity.evaluatedAt,
    };
  }

  static toDtoList(entities: EvaluationResult[]): HistoryItemResponseDto[] {
    return entities.map(this.toDto);
  }
}
