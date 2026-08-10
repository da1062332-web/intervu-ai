import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class DatasetLoaderService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Loads a dataset item matching difficulty, topic, tag rules and selection strategy.
   */
  async loadDatasetItem(template: {
    id: string;
    difficultyLevel: string;
    conceptKey: string;
    datasetConfig?: any;
  }): Promise<{
    id: string;
    content: string;
    metadata: any;
    questionText?: string;
    options?: string[];
    answer?: string;
    explanation?: string;
  }> {
    // 1. Fetch relational configuration
    const config = await this.prismaService.templateDatasetConfig.findUnique({
      where: { templateId: template.id },
    });

    let dataset: any = null;
    let tags: string[] = [];
    let difficultyOverride: string | null = null;
    let topicOverride: string | null = null;
    let selectionMethod = "RANDOM";
    let allowReuse = true;
    let specificItemId: string | null = null;
    let fallbackPolicy = "RELAX_FILTERS";
    let shuffle = true;

    if (config) {
      dataset = await this.prismaService.dataset.findUnique({
        where: { id: config.datasetId },
      });
      tags = config.tags || [];
      difficultyOverride = config.difficultyOverride;
      topicOverride = config.topicOverride;
      selectionMethod = config.selectionMethod || "RANDOM";
      allowReuse = config.allowReuse !== undefined ? config.allowReuse : true;
      specificItemId = config.specificItemId;
      fallbackPolicy = config.fallbackPolicy || "RELAX_FILTERS";
      shuffle = config.shuffle !== undefined ? config.shuffle : true;
    } else {
      // Fallback to legacy JSON config for backward compatibility
      const legacyConfig = template.datasetConfig || {};
      const datasetName = legacyConfig.datasetName || "Vocabulary Synonym List";
      tags = legacyConfig.filters?.tags || [];

      dataset = await this.prismaService.dataset.findFirst({
        where: {
          OR: [{ name: datasetName }, { type: legacyConfig.datasetType }],
        },
      });
    }

    if (!dataset) {
      throw new NotFoundException(
        `Dataset configuration not found or inactive for template ID "${template.id}"`,
      );
    }

    // 2. SPECIFIC Item Selection (Fast-path)
    if (selectionMethod.toUpperCase() === "SPECIFIC" && specificItemId) {
      const item = await this.prismaService.datasetItem.findUnique({
        where: { id: specificItemId },
      });
      if (item && item.datasetId === dataset.id) {
        return {
          id: item.id,
          content: item.content,
          questionText: item.questionText || undefined,
          options: item.options || [],
          answer: item.answer || undefined,
          explanation: item.explanation || undefined,
          metadata: {
            ...(item.metadata as any),
            id: item.id,
          },
        };
      }
      if (fallbackPolicy === "FAIL" || fallbackPolicy === "THROW_ERROR") {
        throw new NotFoundException(
          `Specific dataset item "${specificItemId}" not found.`,
        );
      }
    }

    // 3. Query candidates matching topic, difficulty, and tags
    const queryConditions: any = {
      datasetId: dataset.id,
    };

    const targetDifficulty = (
      difficultyOverride || template.difficultyLevel
    )?.toUpperCase();
    if (targetDifficulty) {
      queryConditions.difficulty = targetDifficulty;
    }

    if (topicOverride) {
      queryConditions.topic = topicOverride;
    }

    if (tags.length > 0) {
      queryConditions.tags = {
        hasSome: tags,
      };
    }

    let items = await this.prismaService.datasetItem.findMany({
      where: queryConditions,
      orderBy: { id: "asc" }, // Deterministic order for sequential selection
    });

    // Fallback: If no items match strict filters
    if (items.length === 0) {
      if (fallbackPolicy === "FAIL" || fallbackPolicy === "THROW_ERROR") {
        throw new NotFoundException(
          `No dataset items match criteria: ${JSON.stringify(queryConditions)}`,
        );
      }
      // Default fallback: Relax filters
      items = await this.prismaService.datasetItem.findMany({
        where: { datasetId: dataset.id },
        orderBy: { id: "asc" },
      });
    }

    if (items.length === 0) {
      throw new NotFoundException(
        `No items found in dataset "${dataset.name}"`,
      );
    }

    // 4. Record Reuse Filter
    let candidates = items;
    if (!allowReuse) {
      const generated = await this.prismaService.question.findMany({
        where: { templateId: template.id },
        select: { metadata: true },
      });
      const usedIds = new Set(
        generated
          .map((q) => (q.metadata as any)?.datasetItem?.id)
          .filter(Boolean),
      );

      const unusedCandidates = candidates.filter(
        (item) => !usedIds.has(item.id),
      );
      if (unusedCandidates.length > 0) {
        candidates = unusedCandidates;
      }
      // If all candidates are used, fallback to reusing items instead of failing
    }

    // 5. Select Item based on Strategy
    let selected: any = null;

    if (selectionMethod.toUpperCase() === "SEQUENTIAL") {
      // Trace last used item in sequential order
      const generated = await this.prismaService.question.findMany({
        where: { templateId: template.id },
        select: { metadata: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });

      const lastUsedId =
        generated.length > 0
          ? (generated[0].metadata as any)?.datasetItem?.id
          : null;
      let nextIndex = 0;

      if (lastUsedId) {
        const lastIdx = candidates.findIndex((item) => item.id === lastUsedId);
        if (lastIdx !== -1) {
          nextIndex = (lastIdx + 1) % candidates.length;
        }
      }

      selected = candidates[nextIndex];
    } else {
      // Default to RANDOM (with optional shuffle)
      if (shuffle) {
        selected = candidates[Math.floor(Math.random() * candidates.length)];
      } else {
        selected = candidates[0];
      }
    }

    return {
      id: selected.id,
      content: selected.content,
      questionText: selected.questionText || undefined,
      options: selected.options || [],
      answer: selected.answer || undefined,
      explanation: selected.explanation || undefined,
      metadata: {
        ...(selected.metadata as any),
        id: selected.id,
      },
    };
  }
}
