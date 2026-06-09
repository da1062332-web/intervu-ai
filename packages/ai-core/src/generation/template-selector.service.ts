import { TemplateRepository } from "@intervu-ai/database";
import { DifficultyLevel, Template } from "@prisma/client";
import { GenerationRequest } from "./types/generation.types";

export class TemplateSelectorService {
  private readonly templateRepository: TemplateRepository;

  constructor(templateRepository?: TemplateRepository) {
    this.templateRepository = templateRepository || new TemplateRepository();
  }

  /**
   * Selects a template from the database based on the concept, difficulty, and type.
   * Selection is 100% deterministic using the provided seed.
   */
  async selectTemplate(
    request: GenerationRequest,
    seed: number,
  ): Promise<Template> {
    const conceptKey = request.conceptKey;
    const dbDifficulty = request.difficultyLevel.toUpperCase() as DifficultyLevel;

    // Fetch matching templates from the database
    const templates = await this.templateRepository.findByConceptAndDifficulty(
      conceptKey,
      dbDifficulty,
    );

    // Filter by question type (case-insensitive)
    const normalizedRequestType = this.normalizeQuestionType(request.questionType);
    const filteredTemplates = templates.filter((t) => {
      const normalizedTemplateType = this.normalizeQuestionType(t.questionType);
      return normalizedTemplateType === normalizedRequestType;
    });

    if (filteredTemplates.length === 0) {
      throw new Error(
        `Template not found for concept: ${conceptKey}, difficulty: ${request.difficultyLevel}, type: ${request.questionType}`,
      );
    }

    // Sort alphabetically by templateKey to ensure deterministic selection order
    filteredTemplates.sort((a, b) => a.templateKey.localeCompare(b.templateKey));

    // Choose deterministically based on seed
    const index = Math.abs(seed) % filteredTemplates.length;
    return filteredTemplates[index];
  }

  private normalizeQuestionType(type: string): string {
    const upper = type.toUpperCase();
    if (upper === "MCQ" || upper === "MULTIPLE_CHOICE") {
      return "MULTIPLE_CHOICE";
    }
    return upper;
  }
}
