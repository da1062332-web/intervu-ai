export interface QuestionValidationDto {
  questionId: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validatedAt: string;
}
