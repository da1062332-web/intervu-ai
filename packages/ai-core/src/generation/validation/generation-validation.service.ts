import { GeneratedQuestionSchema } from "@intervu-ai/contracts";
import { QuestionValidationDto } from "@intervu-ai/contracts";
import { GenerationResult } from "../types/generation.types";

export class GenerationValidationService {
  /**
   * Validates a generated question against DTO constraints and schema structure.
   * Reuses standard contracts from @intervu-ai/contracts.
   */
  validateQuestion(
    questionId: string,
    result: GenerationResult,
  ): QuestionValidationDto {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate against the GeneratedQuestion DTO Zod schema (from @intervu-ai/contracts)
    const dtoPayload = {
      questionId,
      templateId: result.hash, // Mapped to templateId or templateKey reference
      conceptKey: result.conceptKey,
      difficultyLevel: result.difficultyLevel,
      questionType: "mcq", // Default type
      questionText: result.questionText,
      options: result.options,
      correctAnswer: result.correctAnswer,
      solution: JSON.stringify(result.solution),
      metadata: result.parameters,
    };

    const schemaCheck = GeneratedQuestionSchema.safeParse(dtoPayload);
    if (!schemaCheck.success) {
      errors.push(
        ...schemaCheck.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      );
    }

    // 2. Options validation (minimum 4 options required, correct answer must be present)
    if (!result.options || result.options.length < 4) {
      errors.push("Options array must contain at least 4 items for MCQ type.");
    }
    if (result.options && !result.options.includes(result.correctAnswer)) {
      errors.push("Correct answer must exist in options list.");
    }

    // 3. Metadata validation
    const metadata = result.parameters;
    if (!metadata) {
      errors.push("Metadata parameters are missing.");
    }

    const isValid = errors.length === 0;

    return {
      questionId,
      isValid,
      errors,
      warnings,
      validatedAt: new Date().toISOString(),
    };
  }
}
