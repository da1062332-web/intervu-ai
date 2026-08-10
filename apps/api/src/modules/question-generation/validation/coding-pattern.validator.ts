import { Injectable } from "@nestjs/common";
import {
  IValidationStrategy,
  RawQuestion,
  ValidationReport,
} from "../interfaces/validation-strategy.interface";
import { GenerationContext, CodingPatternPayload } from "../interfaces/generation-context.interface";

@Injectable()
export class CodingPatternValidator implements IValidationStrategy {
  async validate(
    context: GenerationContext,
    question: RawQuestion,
  ): Promise<ValidationReport> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const payload = context.payload as CodingPatternPayload;

    if (!payload.oracleKey) {
      errors.push("Coding pattern payload missing required oracleKey.");
    }

    if (!payload.generatedInput || typeof payload.generatedInput !== "object") {
      errors.push("Coding pattern payload missing valid generatedInput object.");
    }

    if (!payload.expectedOutput || typeof payload.expectedOutput !== "object") {
      errors.push("Coding pattern payload missing valid expectedOutput object.");
    }

    if (!Array.isArray(payload.publicTests) || payload.publicTests.length === 0) {
      errors.push("Coding pattern must contain at least 1 public test case.");
    }

    if (!Array.isArray(payload.hiddenTests) || payload.hiddenTests.length === 0) {
      warnings.push("Coding pattern contains no hidden evaluation test cases.");
    }

    if (!question.questionText || question.questionText.trim().length === 0) {
      errors.push("Coding question text cannot be empty.");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
