import { GeneratedQuestion } from "@prisma/client";

export const QUESTION_SOURCE_TOKEN = "QUESTION_SOURCE_TOKEN";

export interface QuestionFilters {
  conceptKey?: string;
  difficultyLevel?: string;
  excludeIds?: string[];
  limit?: number;
}

export interface IQuestionSource {
  fetchQuestions(filters: QuestionFilters): Promise<GeneratedQuestion[]>;
}
