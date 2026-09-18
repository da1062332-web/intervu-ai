import { Injectable } from "@nestjs/common";
import {
  IValidationStrategy,
  ValidationReport,
  RawQuestion,
} from "../interfaces/validation-strategy.interface";
import { GenerationContext } from "../interfaces/generation-context.interface";

@Injectable()
export class ManualValidator implements IValidationStrategy {
  async validate(
    _context: GenerationContext,
    question: RawQuestion,
  ): Promise<ValidationReport> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!question.questionText?.trim() && !(_context.payload as any)?.questionMediaId) {
      warnings.push("Manual question has no text prompt (diagram-only).");
    }

    if (!question.options || question.options.length < 2) {
      errors.push(`Manual MCQ questions require at least 2 options.`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}
