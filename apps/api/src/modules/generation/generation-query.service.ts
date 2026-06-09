import { Injectable, Logger } from "@nestjs/common";
import {
  QuestionPoolRepository,
  QuestionPoolFilter,
  GeneratedQuestion,
  DifficultyLevel,
} from "@intervu-ai/database";

@Injectable()
export class GenerationQueryService {
  private readonly logger = new Logger(GenerationQueryService.name);
  private questionPoolRepository: QuestionPoolRepository;

  constructor() {
    this.questionPoolRepository = new QuestionPoolRepository();
  }

  async getQuestionsByConcept(
    conceptKey: string,
    limit: number = 50,
    page: number = 1,
  ): Promise<GeneratedQuestion[]> {
    this.logger.debug(`Fetching questions for concept: ${conceptKey}`);
    return await this.questionPoolRepository.findQuestions(
      { conceptKey },
      { limit, page },
    );
  }

  async getQuestionsByDifficulty(
    difficultyLevel: DifficultyLevel,
    limit: number = 50,
    page: number = 1,
  ): Promise<GeneratedQuestion[]> {
    this.logger.debug(`Fetching questions for difficulty: ${difficultyLevel}`);
    return await this.questionPoolRepository.findQuestions(
      { difficultyLevel },
      { limit, page },
    );
  }

  /**
   * Retrieves a strict, distinct set of randomized questions for Day 3 Assembly.
   * Utilizes the In-Memory ID Shuffle strategy from the repository to ensure POOL-009 requirements.
   */
  async getQuestionsForAssembly(
    filters: QuestionPoolFilter,
    requiredCount: number,
  ): Promise<GeneratedQuestion[]> {
    this.logger.debug(
      `Fetching ${requiredCount} randomized questions for assembly with filters: ${JSON.stringify(filters)}`,
    );
    return await this.questionPoolRepository.findRandomizedSet(
      filters,
      requiredCount,
    );
  }

  async countAvailableQuestions(filters?: QuestionPoolFilter): Promise<number> {
    return await this.questionPoolRepository.count(filters);
  }
}
