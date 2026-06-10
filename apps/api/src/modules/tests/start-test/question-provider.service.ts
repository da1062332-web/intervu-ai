import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { GeneratedQuestionRepository } from "../../question-pool/repositories/generated-question.repository";

import { GeneratedQuestion } from "@prisma/client";

export interface QuestionRequirement {
  conceptKey: string;
  difficultyLevel: "EASY" | "MEDIUM" | "HARD";
  count: number;
}

@Injectable()
export class QuestionProviderService {
  constructor(
    private readonly questionRepository: GeneratedQuestionRepository,
  ) {}

  async fetchOrGenerateQuestions(
    requirements: QuestionRequirement[],
  ): Promise<GeneratedQuestion[]> {
    const results: GeneratedQuestion[] = [];

    for (const req of requirements) {
      // Try to fetch from pool
      const poolQuestions = await this.questionRepository.findForConcept(
        req.conceptKey,
        req.difficultyLevel,
        req.count,
      );

      if (poolQuestions.length >= req.count) {
        results.push(...poolQuestions);
        continue;
      }

      // If pool is empty or not enough, invoke Generation Engine
      // Abstraction: This is where we'd call the AI Generation Engine via BullMQ or an internal service.
      // Since it's not fully implemented in Day 2 MVP, we throw or return a simulated generation error.
      // Wait, the instructions say "Never use mocked business logic" and "If an interface is missing, define a clean abstraction instead of mocking."
      // So we will throw QUESTION_POOL_EMPTY if we can't generate it immediately here.
      throw new InternalServerErrorException({
        code: "QUESTION_POOL_EMPTY",
        message: `Not enough questions in pool for concept ${req.conceptKey} and difficulty ${req.difficultyLevel}. Generation Service invocation is required.`,
      });
    }

    return results;
  }
}
