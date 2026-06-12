import { RecommendationResultDto } from "@intervu-ai/contracts";

export class RecommendationValidatorService {
  private readonly validSkillsAndConcepts = new Set([
    "time_work",
    "percentages",
    "probability",
    "averages",
    "profit_loss",
    "aptitude",
    "reasoning",
  ]);

  /**
   * Validates recommendation result to verify skills, priorities, descriptions, and check for duplicates.
   */
  validate(result: RecommendationResultDto): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!result) {
      errors.push("Recommendation result is null or undefined.");
      return { isValid: false, errors };
    }

    if (!result.recommendations || !Array.isArray(result.recommendations)) {
      errors.push("Recommendations must be a valid array.");
      return { isValid: false, errors };
    }

    const seenSkills = new Set<string>();
    const seenIds = new Set<string>();

    for (const rec of result.recommendations) {
      if (!rec) {
        errors.push("Found null or undefined recommendation in list.");
        continue;
      }

      // Check recommendationId
      if (
        !rec.recommendationId ||
        typeof rec.recommendationId !== "string" ||
        rec.recommendationId.trim() === ""
      ) {
        errors.push("Recommendation ID is missing or empty.");
      } else {
        if (seenIds.has(rec.recommendationId)) {
          errors.push(
            `Duplicate recommendation ID found: ${rec.recommendationId}`,
          );
        }
        seenIds.add(rec.recommendationId);
      }

      // Check skill
      if (
        !rec.skill ||
        typeof rec.skill !== "string" ||
        rec.skill.trim() === ""
      ) {
        errors.push("Skill/concept identifier is missing or empty.");
      } else {
        if (!this.validSkillsAndConcepts.has(rec.skill)) {
          errors.push(`Invalid skill/concept identifier: ${rec.skill}`);
        }
        if (seenSkills.has(rec.skill)) {
          errors.push(
            `Duplicate recommendation for skill/concept: ${rec.skill}`,
          );
        }
        seenSkills.add(rec.skill);
      }

      // Check priority
      if (!rec.priority || !["HIGH", "MEDIUM", "LOW"].includes(rec.priority)) {
        errors.push(
          `Invalid priority value: ${rec.priority}. Must be HIGH, MEDIUM, or LOW.`,
        );
      }

      // Check title
      if (
        !rec.title ||
        typeof rec.title !== "string" ||
        rec.title.trim() === ""
      ) {
        errors.push("Recommendation title is missing or empty.");
      }

      // Check description
      if (
        !rec.description ||
        typeof rec.description !== "string" ||
        rec.description.trim() === ""
      ) {
        errors.push("Recommendation description is missing or empty.");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
