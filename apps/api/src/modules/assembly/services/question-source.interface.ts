import { GeneratedQuestion } from "@prisma/client";

export const QUESTION_SOURCE_TOKEN = "QUESTION_SOURCE_TOKEN";

export interface QuestionFilters {
  conceptKey?: string;
  difficultyLevel?: string;
  excludeIds?: string[];
  limit?: number;
  examId?: string;
  questionType?: string;
}

export interface IQuestionSource {
  fetchQuestions(filters: QuestionFilters): Promise<GeneratedQuestion[]>;
}
