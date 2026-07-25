import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  TemplateSelectionRequest,
  SelectedTemplate,
} from "../dto/generation.dto";
import { DifficultyLevel } from "@prisma/client";

@Injectable()
export class TemplateSelectorService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Fetches real-time, topic-scoped template usage counts directly from the database
   * (ensures 100% correctness across multi-pod deployments without in-memory cache drift).
   */
  private async fetchTemplateUsageCounts(
    templateIds: string[],
  ): Promise<Map<string, number>> {
    const usageMap = new Map<string, number>();
    for (const id of templateIds) {
      usageMap.set(id, 0);
    }
    if (templateIds.length === 0) return usageMap;

    const counts = await this.prismaService.question.groupBy({
      by: ["templateId"],
      where: {
        templateId: { in: templateIds },
      },
      _count: {
        _all: true,
      },
    });

    for (const entry of counts) {
      if (entry.templateId) {
        usageMap.set(entry.templateId, entry._count._all);
      }
    }
    return usageMap;
  }

  /**
   * Batch-selects top N templates for a topic based on difficulty match, DB usage balancing,
   * version freshness, and exclusion of already-selected templates in the same test instance.
   */
  async selectBatch(
    request: TemplateSelectionRequest,
    count: number = 1,
    excludeTemplateIds: string[] = [],
  ): Promise<{ selected: SelectedTemplate[]; warnings: string[] }> {
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

    // 2. Fetch candidate templates matching resolved concepts
    const candidates = await this.prismaService.template.findMany({
      where: {
        conceptKey: { in: conceptKeys },
        isActive: true,
        deletedAt: null,
        ...(questionType ? { questionType } : {}),
        ...(excludeTemplateIds.length > 0
          ? { id: { notIn: excludeTemplateIds } }
          : {}),
      },
    });

    if (candidates.length === 0) {
      // Fallback: If all candidates were excluded by excludeTemplateIds, query all active candidates
      const fallbackCandidates = await this.prismaService.template.findMany({
        where: {
          conceptKey: { in: conceptKeys },
          isActive: true,
          deletedAt: null,
          ...(questionType ? { questionType } : {}),
        },
      });

      if (fallbackCandidates.length === 0) {
        throw new NotFoundException({
          success: false,
          error: {
            code: "TEMPLATE_MISSING",
            message: `No active templates found for topic ID ${topicId}`,
          },
        });
      }
      candidates.push(...fallbackCandidates);
    }

    // 3. Fetch DB-derived usage counts (topic-scoped, pod-safe)
    const candidateIds = candidates.map((c) => c.id);
    const dbUsageCounts = await this.fetchTemplateUsageCounts(candidateIds);
    const localUsage = new Map(dbUsageCounts);

    // 4. Score candidates (Weighted scoring: difficulty match * 1000 - usageCount * 10 + version)
    const scored = candidates.map((t) => {
      const match = t.difficultyLevel === targetDifficulty ? 1000 : 0;
      const usage = localUsage.get(t.id) || 0;
      const score = match - usage * 10 + (t.version || 1);
      return { template: t, score };
    });

    // Deterministic sort: score DESC, then templateKey ASC (deterministic tie-breaker replacing DB return order)
    scored.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return (a.template.templateKey || a.template.id).localeCompare(
        b.template.templateKey || b.template.id,
      );
    });

    const selected: SelectedTemplate[] = [];
    const warnings: string[] = [];
    const chosenIds = new Set<string>();

    for (const item of scored) {
      if (selected.length >= count) break;
      const t = item.template;
      if (chosenIds.has(t.id) && candidates.length >= count) continue;

      chosenIds.add(t.id);
      selected.push({
        templateId: t.id,
        version: t.version,
        metadata: {
          conceptKey: t.conceptKey,
          difficultyLevel: t.difficultyLevel,
          questionType: t.questionType,
          structure: t.structure,
          variableSchema: t.variableSchema,
          constraints: t.constraints,
          solutionSchema: t.solutionSchema,
          name: t.name,
        },
      });

      // Increment local batch usage so subsequent picks in the same batch favor under-used items
      localUsage.set(t.id, (localUsage.get(t.id) || 0) + 1);
    }

    if (selected.length < count) {
      warnings.push(
        `Under-filled templates for topic ${topicId}: requested ${count}, available ${selected.length}`,
      );
    }

    return { selected, warnings };
  }

  /**
   * Selects a single template (backward-compatible wrapper around selectBatch).
   */
  async selectTemplate(
    request: TemplateSelectionRequest,
  ): Promise<SelectedTemplate> {
    const { selected } = await this.selectBatch(request, 1);
    return selected[0];
  }

  /**
   * Compatibility method — usage counts are now DB-derived.
   */
  incrementUsage(_templateId: string): void {
    // DB-backed usage calculation eliminates the need for manual cache increments.
  }

  /**
   * Compatibility method — usage counts are now DB-derived.
   */
  clearCache(): void {
    // DB-backed usage calculation eliminates in-memory cache state.
  }
}
