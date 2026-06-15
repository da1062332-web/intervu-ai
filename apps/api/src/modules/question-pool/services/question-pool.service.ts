import { Injectable } from "@nestjs/common";
import { DifficultyLevel, GeneratedQuestion } from "@prisma/client";
import { GeneratedQuestionRepository } from "../repositories/generated-question.repository";

@Injectable()
export class QuestionPoolService {
  constructor(
    private readonly generatedQuestionRepository: GeneratedQuestionRepository,
  ) {}

  async findAvailableQuestions(
    difficulty: DifficultyLevel,
    excludeIds: string[],
    limit: number,
  ): Promise<GeneratedQuestion[]> {
    return this.generatedQuestionRepository.findAvailableQuestions(
      difficulty,
      excludeIds,
      limit,
    );
  }
}
