import { GeneratedQuestionDto, ValidationErrorDetail } from "@intervu-ai/contracts";
import { VALIDATION_RULES } from "./rules/validation-rules";

export class AnswerValidatorService {
  /**
   * Validates the answer correctness and integrity.
   * Method conforms to standard backend rules.
   */
  validateAnswer(question: GeneratedQuestionDto): {
    passed: boolean;
    score: number;
    errors: ValidationErrorDetail[];
    warnings: string[];
  } {
    const errors: ValidationErrorDetail[] = [];
    const warnings: string[] = [];

    const questionType = question.questionType;
    const correctAnswer = question.correctAnswer;
    const options = question.options;
    const solution = question.solution;

    // 1. Correct Answer Not Empty
    if (!correctAnswer || String(correctAnswer).trim() === "") {
      errors.push({
        code: "MISSING_ANSWER",
        reason: "Correct answer must not be empty.",
      });
    }

    // 2. MCQ Specific Checks
    if (questionType === "mcq") {
      if (!options || !Array.isArray(options)) {
        errors.push({
          code: "INVALID_OPTION_SET",
          reason: "Options array is required for MCQ.",
        });
      } else {
        const mcqMin = VALIDATION_RULES.MCQ_MIN_OPTIONS;
        const maxOpt = VALIDATION_RULES.MAX_OPTIONS;

        if (options.length < mcqMin || options.length > maxOpt) {
          errors.push({
            code: "INVALID_OPTION_SET",
            reason: `MCQ must have between ${mcqMin} and ${maxOpt} options.`,
          });
        }

        if (!options.includes(correctAnswer)) {
          errors.push({
            code: "INVALID_MCQ_OPTIONS",
            reason: "Correct answer does not exist in options list.",
          });
        }
      }
    }

    // 3. Numeric Specific Checks
    if (questionType === "numeric") {
      if (correctAnswer) {
        const parsed = Number(String(correctAnswer).trim());
        if (isNaN(parsed)) {
          errors.push({
            code: "INVALID_NUMERIC_ANSWER",
            reason: "Correct answer is not a valid numeric value.",
          });
        }
      }
    }

    // 4. Solution contains answer logic
    if (solution && correctAnswer) {
      const solStr = typeof solution === "string" ? solution : JSON.stringify(solution);
      if (!solStr.includes(String(correctAnswer))) {
        errors.push({
          code: "MISSING_ANSWER_LOGIC",
          reason: "Solution text does not contain the correct answer value/logic.",
        });
      }
    }

    const passed = errors.length === 0;
    const score = passed ? 25 : 0;

    return {
      passed,
      score,
      errors,
      warnings,
    };
  }
}
