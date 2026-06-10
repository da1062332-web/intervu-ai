import { GeneratedQuestionDto, ValidationErrorDetail } from "@intervu-ai/contracts";
import { VALIDATION_RULES } from "./rules/validation-rules";

export class QualityValidatorService {
  /**
   * Validates quality, completeness, formatting, and readability of the question.
   * Method conforms to standard backend rules.
   */
  validateQuality(question: GeneratedQuestionDto): {
    passed: boolean;
    score: number;
    errors: ValidationErrorDetail[];
    warnings: string[];
  } {
    const errors: ValidationErrorDetail[] = [];
    const warnings: string[] = [];

    const questionText = question.questionText || "";
    const solution = question.solution || "";
    const metadata = question.metadata || {};

    const minQ = VALIDATION_RULES.MIN_QUESTION_LENGTH;
    const minS = VALIDATION_RULES.MIN_SOLUTION_LENGTH;

    // 1. Minimum Question Length
    if (questionText.length < minQ) {
      errors.push({
        code: "QUALITY_FAILURE",
        reason: `Question text length is ${questionText.length}, which is less than the minimum required length of ${minQ} characters.`,
      });
    }

    // 2. Minimum Solution/Explanation Length
    const solStr = typeof solution === "string" ? solution : JSON.stringify(solution);
    if (solStr.length < minS) {
      errors.push({
        code: "QUALITY_FAILURE",
        reason: `Solution length is ${solStr.length}, which is less than the minimum required length of ${minS} characters.`,
      });
    }

    // 3. Metadata Completeness
    if (!metadata || Object.keys(metadata).length === 0) {
      errors.push({
        code: "QUALITY_FAILURE",
        reason: "Metadata parameters are incomplete or empty.",
      });
    }

    // 4. Readability and Formatting
    const trimmed = questionText.trim();
    if (questionText !== trimmed) {
      errors.push({
        code: "QUALITY_FAILURE",
        reason: "Question text has leading or trailing whitespaces.",
      });
    }

    if (trimmed.length > 0) {
      // Starts with capital letter or digit
      const startChar = trimmed.charAt(0);
      if (!/[A-Z0-9]/.test(startChar)) {
        errors.push({
          code: "QUALITY_FAILURE",
          reason: "Question text must start with an uppercase letter or a digit.",
        });
      }

      // Ends with punctuation
      const endChar = trimmed.charAt(trimmed.length - 1);
      if (!/[?.!:]/.test(endChar)) {
        errors.push({
          code: "QUALITY_FAILURE",
          reason: "Question text must end with proper punctuation (e.g. ?, ., !, :).",
        });
      }
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
