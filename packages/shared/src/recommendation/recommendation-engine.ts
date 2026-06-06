import { z } from "zod";
import {
  RecommendationDto,
  RecommendationEngine,
  SkillScore,
} from "./recommendation.types";
import {
  determinePriority,
  removeDuplicates,
  SkillRecommendationRule,
} from "./recommendation-rules";
import {
  RECOMMENDATION_MATRIX,
  FALLBACK_RULE,
} from "./recommendation.constants";

// Zod schema to enforce strict runtime type safety and fail-fast validation
const SkillScoreSchema = z.object({
  skill: z.string().min(1, "Skill name must not be empty"),
  score: z
    .number()
    .min(0, "Score must be at least 0")
    .max(100, "Score must be at most 100"),
  topic: z.string().min(1, "Topic must not be empty"),
});

const SkillScoresArraySchema = z.array(SkillScoreSchema);

export class InMemoryRecommendationEngine implements RecommendationEngine {
  /**
   * Generates a prioritized and deduplicated list of learning recommendations from score evaluations.
   *
   * Follows the required function structure:
   * validate(input) -> fetchDependencies(input) -> coreLogic(data) -> formatResponse(result)
   */
  generateRecommendations(skillScores: SkillScore[]): RecommendationDto[] {
    const validatedInput = this.validate(skillScores);
    const dependencies = this.fetchDependencies(validatedInput);
    const processedResult = this.coreLogic(validatedInput, dependencies);
    return this.formatResponse(processedResult);
  }

  /**
   * Step 1: Validate input early and aggressively.
   * Treats incoming input as immutable and throws if the schema is invalid.
   */
  private validate(skillScores: SkillScore[]): SkillScore[] {
    if (!Array.isArray(skillScores)) {
      throw new Error("Input must be an array of skill scores");
    }
    // Parse using Zod schema to enforce types at runtime
    const parseResult = SkillScoresArraySchema.safeParse(skillScores);
    if (!parseResult.success) {
      throw new Error(`Validation Error: ${parseResult.error.message}`);
    }
    // Return a shallow copy of the array to treat the input as immutable
    return [...parseResult.data];
  }

  /**
   * Step 2: Fetch dependencies (matching recommendation rules from the registry).
   */
  private fetchDependencies(
    skillScores: SkillScore[],
  ): Record<string, SkillRecommendationRule> {
    const dependencies: Record<string, SkillRecommendationRule> = {};

    for (const item of skillScores) {
      const skillName = item.skill;
      if (RECOMMENDATION_MATRIX[skillName]) {
        dependencies[skillName] = RECOMMENDATION_MATRIX[skillName];
      } else {
        // Apply robust fallback logic for unrecognized skills
        dependencies[skillName] = FALLBACK_RULE;
      }
    }

    return dependencies;
  }

  /**
   * Step 3: Run the core recommendation generation logic in-memory.
   */
  private coreLogic(
    skillScores: SkillScore[],
    dependencies: Record<string, SkillRecommendationRule>,
  ): RecommendationDto[] {
    const rawRecommendations: RecommendationDto[] = [];

    for (const item of skillScores) {
      const rule = dependencies[item.skill];
      const priority = determinePriority(item.score);
      const recommendationStrings = rule[priority] || [];

      for (const recText of recommendationStrings) {
        rawRecommendations.push({
          skill: item.skill,
          priority: priority,
          recommendation: recText,
          resourceUrl: rule.resourceUrl,
        });
      }
    }

    // Apply clean-up array sanitization (deduplication)
    return removeDuplicates(rawRecommendations);
  }

  /**
   * Step 4: Format the final response mapping exactly to camelCase rules.
   */
  private formatResponse(
    recommendations: RecommendationDto[],
  ): RecommendationDto[] {
    // Return mapped clones ensuring property alignment with the frontend
    return recommendations.map((rec) => ({
      skill: rec.skill,
      priority: rec.priority,
      recommendation: rec.recommendation,
      ...(rec.resourceUrl ? { resourceUrl: rec.resourceUrl } : {}),
    }));
  }
}
