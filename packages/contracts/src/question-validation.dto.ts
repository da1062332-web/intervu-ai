export interface ValidationErrorDetail {
  code: string;
  reason: string;
}

export interface QuestionValidationDto {
  questionId: string;
  isValid: boolean;
  passed: boolean;
  score: number;
  errors: ValidationErrorDetail[];
  warnings: string[];
  validatedAt: string;
}
