import {
  RecommendationPriority,
  RecommendationDto,
} from "./recommendation.types";

export interface SkillRecommendationRule {
  critical: string[];
  high: string[];
  medium: string[];
  low: string[];
  resourceUrl: string;
}

/**
 * Determines the priority classification based on the given score.
 *
 * Score limits:
 * - Score < 40: 'critical'
 * - 40 <= Score <= 60: 'high'
 * - 60 < Score <= 80: 'medium'
 * - Score > 80: 'low'
 */
export function determinePriority(score: number): RecommendationPriority {
  if (score < 40) {
    return "critical";
  } else if (score >= 40 && score <= 60) {
    return "high";
  } else if (score > 60 && score <= 80) {
    return "medium";
  } else {
    return "low";
  }
}

/**
 * Removes duplicate recommendation DTOs from the array.
 * Ensures each unique combination of skill and recommendation text appears exactly once.
 */
export function removeDuplicates(
  recommendations: RecommendationDto[],
): RecommendationDto[] {
  const seen = new Set<string>();
  const uniqueRecommendations: RecommendationDto[] = [];

  for (const rec of recommendations) {
    // Unique key is composed of the skill and recommendation text (trimmed and lowercased for comparison)
    const key = `${rec.skill.toLowerCase()}::${rec.recommendation.trim().toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueRecommendations.push(rec);
    }
  }

  return uniqueRecommendations;
}
