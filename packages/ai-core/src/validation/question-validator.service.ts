import { GeneratedQuestionSchema, ValidationErrorDetail } from "@intervu-ai/contracts";

export class QuestionValidatorService {
  /**
   * Validates structural constraints of the question.
   * Method conforms to standard backend rules.
   */
  validateStructure(question: unknown): {
    passed: boolean;
    score: number;
    errors: ValidationErrorDetail[];
    warnings: string[];
  } {
    const errors: ValidationErrorDetail[] = [];
    const warnings: string[] = [];

    // Early validation using the standard contract Zod schema
    const result = GeneratedQuestionSchema.safeParse(question);

    if (!result.success) {
      for (const issue of result.error.issues) {
        const pathStr = issue.path.join(".");
        let code = "STRUCTURE_ERROR";
        let reason = `${pathStr}: ${issue.message}`;

        if (pathStr === "questionText") {
          code = "MISSING_QUESTION_TEXT";
          reason = "Question text is missing or too short.";
        } else if (pathStr === "correctAnswer") {
          code = "MISSING_ANSWER";
          reason = "Correct answer is missing.";
        } else if (pathStr === "solution") {
          code = "MISSING_SOLUTION";
          reason = "Solution is missing.";
        } else if (pathStr === "difficultyLevel") {
          code = "INVALID_DIFFICULTY";
          reason = "Difficulty level must be easy, medium, or hard.";
        } else if (pathStr === "questionType") {
          code = "INVALID_QUESTION_TYPE";
          reason = "Question type must be mcq, numeric, or coding.";
        } else if (pathStr === "metadata") {
          code = "MISSING_METADATA";
          reason = "Metadata parameters are missing.";
        }

        errors.push({ code, reason });
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
