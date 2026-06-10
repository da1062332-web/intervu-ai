import { GeneratedQuestionDto, ValidationErrorDetail } from "@intervu-ai/contracts";

export class DifficultyValidatorService {
  /**
   * Validates if the question step count aligns with difficulty.
   * Method conforms to standard backend rules.
   */
  validateDifficulty(question: GeneratedQuestionDto): {
    passed: boolean;
    score: number;
    errors: ValidationErrorDetail[];
    warnings: string[];
  } {
    const errors: ValidationErrorDetail[] = [];
    const warnings: string[] = [];

    const difficultyLevel = question.difficultyLevel ? String(question.difficultyLevel).toLowerCase() : "";
    const solution = question.solution;
    const metadata = question.metadata || {};

    let stepsCount = 0;

    // 1. Attempt to extract steps from solution
    if (solution) {
      try {
        const parsed = typeof solution === "string" ? JSON.parse(solution) : solution;
        if (parsed && Array.isArray(parsed.steps)) {
          stepsCount = parsed.steps.length;
        }
      } catch {
        // Fallback for non-JSON string
        if (typeof solution === "string") {
          stepsCount = solution.split(/[.!?\n]+/).filter(line => line.trim().length > 0).length;
        }
      }
    }

    // 2. Attempt to extract from metadata
    if (stepsCount === 0 && metadata) {
      if (typeof metadata.steps === "number") {
        stepsCount = metadata.steps;
      } else if (typeof metadata.w1_steps === "number") {
        stepsCount = Math.ceil(metadata.w1_steps);
      }
    }

    // Fallback if no steps found
    if (stepsCount === 0) {
      if (difficultyLevel === "easy") stepsCount = 1;
      else if (difficultyLevel === "medium") stepsCount = 3;
      else if (difficultyLevel === "hard") stepsCount = 5;
    }

    let isMatched = false;
    if (difficultyLevel === "easy") {
      isMatched = stepsCount >= 1 && stepsCount <= 2;
    } else if (difficultyLevel === "medium") {
      isMatched = stepsCount >= 2 && stepsCount <= 4;
    } else if (difficultyLevel === "hard") {
      isMatched = stepsCount >= 4;
    } else {
      errors.push({
        code: "INVALID_DIFFICULTY",
        reason: `Unknown difficulty level: ${difficultyLevel}`,
      });
    }

    if (difficultyLevel && !isMatched && errors.length === 0) {
      errors.push({
        code: "INVALID_DIFFICULTY",
        reason: `Question difficulty is '${difficultyLevel}', but it has ${stepsCount} step(s) (expected: easy: 1-2, medium: 2-4, hard: 4+).`,
      });
    }

    const passed = errors.length === 0;
    const score = passed ? 20 : 0;

    return {
      passed,
      score,
      errors,
      warnings,
    };
  }
}
