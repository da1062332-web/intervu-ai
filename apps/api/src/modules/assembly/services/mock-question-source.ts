import { Injectable } from "@nestjs/common";
import { IQuestionSource, QuestionFilters } from "./question-source.interface";
import { GeneratedQuestion } from "@prisma/client";

@Injectable()
export class MockQuestionSource implements IQuestionSource {
  async fetchQuestions(filters: QuestionFilters): Promise<GeneratedQuestion[]> {
    // Generate mock questions based on filters
    const questions = [];
    const limit = filters.limit || 10;
    for (let i = 0; i < limit; i++) {
      questions.push({
        id: `mock-q-${Date.now()}-${i}`,
        conceptKey: filters.conceptKey || "general",
        difficultyLevel: filters.difficultyLevel || "MEDIUM",
        questionText: `Mock Question ${i + 1} for ${filters.conceptKey || "general"} (${filters.difficultyLevel || "MEDIUM"})`,
        questionType: "MULTIPLE_CHOICE",
        metadata: {},
      } as unknown as GeneratedQuestion);
    }
    return questions;
  }
}
