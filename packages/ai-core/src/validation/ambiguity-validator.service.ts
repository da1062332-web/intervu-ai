import { GeneratedQuestionDto, ValidationErrorDetail } from "@intervu-ai/contracts";

export class AmbiguityValidatorService {
  /**
   * Validates clarity and detects unresolved placeholders or missing data.
   * Method conforms to standard backend rules.
   */
  validateAmbiguity(question: GeneratedQuestionDto): {
    passed: boolean;
    score: number;
    errors: ValidationErrorDetail[];
    warnings: string[];
  } {
    const errors: ValidationErrorDetail[] = [];
    const warnings: string[] = [];

    const questionText = question.questionText || "";
    const metadata = question.metadata || {};

    // 1. Check for empty/unresolved placeholders or markers like "__" or "[]" or "{}"
    if (
      questionText.includes("{}") ||
      questionText.includes("[]") ||
      questionText.includes("__") ||
      questionText.toLowerCase().includes("undefined") ||
      questionText.toLowerCase().includes("nan") ||
      questionText.toLowerCase().includes("null")
    ) {
      errors.push({
        code: "AMBIGUOUS_QUESTION",
        reason: "Question contains empty or unresolved placeholder markers (e.g. {}, [], __, undefined, null, NaN).",
      });
    }

    // 2. Missing data: check if curly braces placeholders in text are resolved
    const bracesRegex = /\{([a-zA-Z0-9_]+)\}/g;
    let match;
    const missingVars = new Set<string>();

    while ((match = bracesRegex.exec(questionText)) !== null) {
      const varName = match[1];
      if (metadata[varName] === undefined) {
        missingVars.add(varName);
      }
    }

    if (missingVars.size > 0) {
      errors.push({
        code: "AMBIGUOUS_QUESTION",
        reason: `Question contains unresolved variables: ${Array.from(missingVars).join(", ")}. Missing in metadata.`,
      });
    }

    // 3. Contradictory statements / duplicate parameters
    const keys = Object.keys(metadata);
    if (keys.length > 1) {
      const lowerKeys = keys.map(k => k.toLowerCase());
      const duplicates = lowerKeys.filter((item, index) => lowerKeys.indexOf(item) !== index);
      if (duplicates.length > 0) {
        errors.push({
          code: "AMBIGUOUS_QUESTION",
          reason: `Contradictory/duplicate variable names in metadata: ${duplicates.join(", ")}`,
        });
      }
    }

    const passed = errors.length === 0;
    const score = passed ? 10 : 0;

    return {
      passed,
      score,
      errors,
      warnings,
    };
  }
}
