import { Injectable } from "@nestjs/common";
import { RecommendationRepository } from "../repositories/recommendation.repository";
import { RecommendationMapper } from "../mappers/recommendation.mapper";
import { ResultsService } from "./results.service";
import { RecommendationResponseDto } from "@intervu/shared";

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly recommendationRepository: RecommendationRepository,
    private readonly resultsService: ResultsService,
  ) {}

  async getRecommendations(
    userId: string,
    evaluationId: string,
  ): Promise<RecommendationResponseDto[]> {
    // Ownership validation via resultsService
    await this.resultsService.getResultDetails(userId, evaluationId);

    const recommendations =
      await this.recommendationRepository.findByEvaluationId(evaluationId);

    // Sort: HIGH -> MEDIUM -> LOW
    const sorted = recommendations.sort((a, b) => {
      const order = { HIGH: 1, MEDIUM: 2, LOW: 3 };
      return (
        (order[a.priority as keyof typeof order] || 4) -
        (order[b.priority as keyof typeof order] || 4)
      );
    });

    return RecommendationMapper.toDtoList(sorted);
  }

  async getHighPriorityRecommendations(
    userId: string,
    evaluationId: string,
  ): Promise<RecommendationResponseDto[]> {
    const recommendations = await this.getRecommendations(userId, evaluationId);
    return recommendations.filter((r) => r.priority === "HIGH");
  }
}
