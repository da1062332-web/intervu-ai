export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';

export interface RecommendationDto {
  skill: string;
  priority: RecommendationPriority;
  recommendation: string;
  resourceUrl?: string;
}

export interface SkillScore {
  skill: string;
  score: number;
  topic: string;
}

export interface RecommendationEngine {
  generateRecommendations(skillScores: SkillScore[]): RecommendationDto[];
}
