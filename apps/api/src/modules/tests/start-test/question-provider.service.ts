import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { GeneratedQuestionRepository } from "../../question-pool/repositories/generated-question.repository";
import { GenerationService } from "@intervu-ai/ai-core";

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

      const missingCount = req.count - poolQuestions.length;
      if (missingCount <= 0) {
        continue;
      }
      const generationService = new GenerationService();

      for (let i = 0; i < missingCount; i++) {
        try {
          const seedInput = `${req.conceptKey}_${req.difficultyLevel}_${Date.now()}_${i}`;
          const result = await generationService.generateQuestion(
            {
              conceptKey: req.conceptKey,
              difficultyLevel: req.difficultyLevel.toLowerCase() as
                | "easy"
                | "medium"
                | "hard",
              questionType: "mcq",
            },
            seedInput,
          );

          const savedQuestion = await this.questionRepository.create({
            id: result.question.questionId,
            questionHash: result.question.questionId,
            template: { connect: { id: (result.question as any).templateId } },
            conceptKey: result.question.conceptKey,
            difficultyLevel:
              result.question.difficultyLevel.toUpperCase() as any,
            questionType: result.question.questionType,
            questionText: result.question.questionText,
            options: (result.question.options as any) || [],
            correctAnswer: result.question.correctAnswer,
            solution: result.question.solution,
            metadata: (result.question.metadata as any) || {},
          });

          results.push(savedQuestion);
        } catch (e) {
          console.warn(
            "Generation failed, providing fallback mock question:",
            e instanceof Error ? e.message : String(e),
          );
          const mockId = `mock_${req.conceptKey}_${Date.now()}_${i}`;
          const fallbackQuestion = await this.questionRepository.create({
            id: mockId,
            questionHash: mockId,
            conceptKey: req.conceptKey,
            difficultyLevel: req.difficultyLevel.toUpperCase() as any,
            questionType: "MULTIPLE_CHOICE",
            questionText: `[MOCK] What is the answer for ${req.conceptKey}?`,
            options: ["A", "B", "C", "D"],
            correctAnswer: "A",
            solution: "Mock solution",
            metadata: { fallback: true },
            template: {
              connectOrCreate: {
                where: { templateKey: `mock_template_${req.conceptKey}` },
                create: {
                  templateKey: `mock_template_${req.conceptKey}`,
                  conceptKey: req.conceptKey,
                  name: `Mock Template - ${req.conceptKey}`,
                  difficultyLevel: req.difficultyLevel.toUpperCase() as any,
                  questionType: "MULTIPLE_CHOICE",
                },
              },
            },
          });
          results.push(fallbackQuestion);
        }
      }
    }

    return results;
  }
}
