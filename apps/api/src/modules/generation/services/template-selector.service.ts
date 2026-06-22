import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { TemplateSelectionRequest, SelectedTemplate } from "../dto/generation.dto";
import { DifficultyLevel } from "@prisma/client";

@Injectable()
export class TemplateSelectorService {
  private readonly templateUsageCache = new Map<string, number>();

  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Selects a template based on topic, difficulty, version, status, and usage balancing.
   */
  async selectTemplate(request: TemplateSelectionRequest): Promise<SelectedTemplate> {
    const { topicId, difficulty, questionType } = request;
    const targetDifficulty = difficulty.toUpperCase() as DifficultyLevel;

    // 1. Resolve concepts mapped to the topic
    const mappings = await this.prismaService.concept.findMany({
      where: {
        topicId,
        status: "ACTIVE",
      },
    });

    if (mappings.length === 0) {
      throw new NotFoundException({
        success: false,
        error: {
          code: "TOPIC_UNMAPPED",
          message: `No active concepts mapped to topic ID ${topicId}`,
        },
      });
    }

    const conceptKeys = mappings.map((m: any) => m.code);

    // 2. Fetch candidates matching resolved concepts
    const templates = await this.prismaService.template.findMany({
      where: {
        conceptKey: { in: conceptKeys },
        isActive: true,
        deletedAt: null,
        ...(questionType ? { questionType } : {}),
      },
    });

    if (templates.length === 0) {
      throw new NotFoundException({
        success: false,
        error: {
          code: "TEMPLATE_MISSING",
          message: `No active templates found for topic ID ${topicId}`,
        },
      });
    }

    // 3. Populate usage cache for candidate templates to avoid N+1 count queries at scale
    const uncachedTemplateIds = templates.filter((t) => !this.templateUsageCache.has(t.id)).map((t) => t.id);

    if (uncachedTemplateIds.length > 0) {
      const counts = await this.prismaService.question.groupBy({
        by: ["templateId"],
        where: {
          templateId: { in: uncachedTemplateIds },
        },
        _count: {
          _all: true,
        },
      });

      // Initialize all uncached templates with 0 first
      for (const id of uncachedTemplateIds) {
        this.templateUsageCache.set(id, 0);
      }

      // Overwrite with actual DB counts
      for (const entry of counts) {
        if (entry.templateId) {
          this.templateUsageCache.set(entry.templateId, entry._count._all);
        }
      }
    }

    // 4. Ranking Logic:
    //    1. Active Template (already filtered in query)
    //    2. Difficulty Match (exact match preferred)
    //    3. Usage Balance (lower usage count preferred)
    //    4. Latest Version (higher version number preferred)
    templates.sort((a, b) => {
      // 1. Difficulty Level match (Direct match comes first)
      const aMatch = a.difficultyLevel === targetDifficulty ? 1 : 0;
      const bMatch = b.difficultyLevel === targetDifficulty ? 1 : 0;
      if (aMatch !== bMatch) {
        return bMatch - aMatch;
      }

      // 2. Usage Balancing (lower usage comes first)
      const aUsage = this.templateUsageCache.get(a.id) || 0;
      const bUsage = this.templateUsageCache.get(b.id) || 0;
      if (aUsage !== bUsage) {
        return aUsage - bUsage;
      }

      // 3. Version (Latest version first)
      if (a.version !== b.version) {
        return b.version - a.version;
      }

      return 0;
    });

    const bestTemplate = templates[0];

    return {
      templateId: bestTemplate.id,
      version: bestTemplate.version,
      metadata: {
        conceptKey: bestTemplate.conceptKey,
        difficultyLevel: bestTemplate.difficultyLevel,
        questionType: bestTemplate.questionType,
        structure: bestTemplate.structure,
        variableSchema: bestTemplate.variableSchema,
        constraints: bestTemplate.constraints,
        solutionSchema: bestTemplate.solutionSchema,
        name: bestTemplate.name,
      },
    };
  }

  /**
   * Increments the cached template usage count on successful save.
   */
  incrementUsage(templateId: string): void {
    const current = this.templateUsageCache.get(templateId) || 0;
    this.templateUsageCache.set(templateId, current + 1);
  }

  /**
   * Resets the selector usage cache.
   */
  clearCache(): void {
    this.templateUsageCache.clear();
  }
}
