import { RecommendationResponseDto } from "@intervu/shared";

import { Recommendation } from "@prisma/client";

export class RecommendationMapper {
  static toDto(entity: Recommendation): RecommendationResponseDto {
    return {
      id: entity.id,
      evaluationId: entity.evaluationId,
      skill: entity.skill,
      priority: entity.priority,
      title: entity.title,
      description: entity.description,
      createdAt: entity.createdAt,
    };
  }

  static toDtoList(entities: Recommendation[]): RecommendationResponseDto[] {
    return entities.map(this.toDto);
  }
}
