import { GeneratedQuestionDto } from "./generated-question.dto";

export interface QuestionPoolDto {
  questions: GeneratedQuestionDto[];
  total: number;
  generatedAt: string;
}
