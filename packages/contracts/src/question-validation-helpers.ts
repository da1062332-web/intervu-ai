import { ValidationError } from "./errors";
import { TemplateSchema, Template } from "./schemas/template.schema";
import {
  GeneratedQuestionSchema,
  GeneratedQuestion,
} from "./schemas/generated-question.schema";
import {
  QuestionValidationSchema,
  QuestionValidation,
} from "./schemas/question-validation.schema";
import {
  QuestionPoolSchema,
  QuestionPool,
} from "./schemas/question-pool.schema";
import {
  CandidateQuestionSchema,
  CandidateQuestion,
} from "./schemas/candidate-question.schema";

export function validateTemplate(data: unknown): Template {
  const result = TemplateSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(
      `Template validation failed: ${result.error.message}`,
      result.error.format(),
    );
  }
  return result.data;
}

export function validateGeneratedQuestion(data: unknown): GeneratedQuestion {
  const result = GeneratedQuestionSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(
      `Generated question validation failed: ${result.error.message}`,
      result.error.format(),
    );
  }
  return result.data;
}

export function validateQuestionValidation(data: unknown): QuestionValidation {
  const result = QuestionValidationSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(
      `Question validation report failed: ${result.error.message}`,
      result.error.format(),
    );
  }
  return result.data;
}

export function validateQuestionPool(data: unknown): QuestionPool {
  const result = QuestionPoolSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(
      `Question pool validation failed: ${result.error.message}`,
      result.error.format(),
    );
  }
  return result.data;
}

export function validateCandidateQuestion(data: unknown): CandidateQuestion {
  const result = CandidateQuestionSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(
      `Candidate question validation failed: ${result.error.message}`,
      result.error.format(),
    );
  }
  return result.data;
}
