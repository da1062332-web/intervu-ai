import { ExecutionResult, EvaluationResultDto } from "@intervu-ai/contracts";

export class EvaluationValidatorService {
  /**
   * Validates the input submission result.
   */
  validateInput(
    executionResult: ExecutionResult,
    totalQuestions: number,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!executionResult) {
      errors.push("Execution result is null or undefined.");
      return { isValid: false, errors };
    }

    if (!executionResult.answers || !Array.isArray(executionResult.answers)) {
      errors.push("Answers must be a valid array.");
    } else {
      if (executionResult.answers.length === 0) {
        errors.push("Answers array is empty.");
      }
      if (executionResult.answers.length !== totalQuestions) {
        errors.push(
          `Question count mismatch: candidate submitted ${executionResult.answers.length} answer(s), but the test requires ${totalQuestions} question(s).`,
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates the output evaluation result.
   */
  validateResult(result: EvaluationResultDto): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!result) {
      errors.push("Evaluation result is null or undefined.");
      return { isValid: false, errors };
    }

    if (
      result.overallScore < 0 ||
      result.overallScore > 100 ||
      isNaN(result.overallScore)
    ) {
      errors.push(
        `Invalid overall score: ${result.overallScore}. Must be between 0 and 100.`,
      );
    }

    if (
      result.confidenceScore < 0 ||
      result.confidenceScore > 100 ||
      isNaN(result.confidenceScore)
    ) {
      errors.push(
        `Invalid confidence score: ${result.confidenceScore}. Must be between 0 and 100.`,
      );
    }

    if (result.skillScores && typeof result.skillScores === "object") {
      for (const [skill, score] of Object.entries(result.skillScores)) {
        if (score < 0 || score > 100 || isNaN(score)) {
          errors.push(
            `Invalid score for skill '${skill}': ${score}. Must be between 0 and 100.`,
          );
        }
      }
    } else {
      errors.push("Skill scores must be a valid record mapping.");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
