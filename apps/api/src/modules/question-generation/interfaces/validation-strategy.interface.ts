import { GenerationContext } from "./generation-context.interface";

export interface ValidationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RawQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

/**
 * Every concrete validator (Variable, Dataset, Hybrid) implements this interface.
 * The ValidationRegistry resolves the correct validator per strategy.
 */
export interface IValidationStrategy {
  validate(
    context: GenerationContext,
    question: RawQuestion,
  ): Promise<ValidationReport>;
}
