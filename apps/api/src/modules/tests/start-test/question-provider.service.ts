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
      // 1. Try to fetch from pool
      const poolQuestions = await this.questionRepository.findForConcept(
        req.conceptKey,
        req.difficultyLevel,
        req.count,
      );

      if (poolQuestions.length > 0) {
        results.push(...poolQuestions);
      }

      if (results.length >= req.count) {
        continue;
      }

      const missingCount = req.count - results.length;
      if (missingCount <= 0) {
        continue;
      }

      try {
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

            const templateId = (result.question as any).templateId;
            const createInput: any = {
              id: result.question.questionId,
              questionHash: result.question.questionId,
              conceptKey: result.question.conceptKey || req.conceptKey,
              difficultyLevel:
                (result.question.difficultyLevel?.toUpperCase() ||
                  req.difficultyLevel) as any,
              questionType: result.question.questionType || "mcq",
              questionText: result.question.questionText,
              options: (result.question.options as any) || [],
              correctAnswer: result.question.correctAnswer || "",
              solution: result.question.solution || "",
              metadata: (result.question.metadata as any) || {},
            };

            if (templateId) {
              createInput.template = { connect: { id: templateId } };
            }

            try {
              const savedQuestion =
                await this.questionRepository.create(createInput);
              results.push(savedQuestion);
            } catch {
              // Fallback: retry without template connection if template ID does not exist in DB
              delete createInput.template;
              const savedQuestion =
                await this.questionRepository.create(createInput);
              results.push(savedQuestion);
            }
          } catch (err) {
            console.warn(
              "Question generation iteration failed:",
              err instanceof Error ? err.message : String(err),
            );
          }
        }
      } catch (genError) {
        if (results.length === 0) {
          throw new InternalServerErrorException({
            code: "QUESTION_POOL_EMPTY",
            message: `Question pool empty and generation unavailable for concept: '${req.conceptKey}' (${req.difficultyLevel})`,
          });
        }
      }

      if (results.length < req.count) {
        throw new InternalServerErrorException({
          code: "QUESTION_POOL_EMPTY",
          message: `Question pool empty and generation failed for concept: '${req.conceptKey}' (${req.difficultyLevel}). Found ${results.length}, needed ${req.count}.`,
        });
      }
    }

    return results;
  }
}
