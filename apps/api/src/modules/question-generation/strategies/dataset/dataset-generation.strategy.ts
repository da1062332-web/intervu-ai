import { Injectable, NotFoundException } from "@nestjs/common";
import { Template } from "@prisma/client";
import { PrismaService } from "../../../../prisma/prisma.service";
import { IQuestionGenerationStrategy } from "../../interfaces/generation-strategy.interface";
import {
  GenerationContext,
  DatasetPayload,
} from "../../interfaces/generation-context.interface";

/**
 * DatasetGenerationStrategy
 *
 * Implements IQuestionGenerationStrategy for the DATASET strategy.
 * Reads template.datasetConfig to select a matching DatasetItem
 * and returns a GenerationContext with passage + metadata.
 */
@Injectable()
export class DatasetGenerationStrategy implements IQuestionGenerationStrategy {
  constructor(private readonly prisma: PrismaService) {}

  async generate(template: Template): Promise<GenerationContext> {
    // 1. Fetch relational configuration
    const config = await this.prisma.templateDatasetConfig.findUnique({
      where: { templateId: template.id },
    });

    let dataset: any = null;
    let difficulty: string | undefined = undefined;
    let topic: string | undefined = undefined;
    let tags: string[] = [];

    if (config) {
      dataset = await this.prisma.dataset.findUnique({
        where: { id: config.datasetId },
      });
      difficulty = config.difficultyOverride || undefined;
      topic = config.topicOverride || undefined;
      tags = config.tags || [];
    } else {
      // Fallback to legacy JSON config for backward compatibility
      const legacyConfig = (template.datasetConfig as Record<string, unknown>) ?? {};
      const datasetType = (legacyConfig.datasetType as string) || undefined;
      topic = (legacyConfig.topic as string) || undefined;
      difficulty = (legacyConfig.difficulty as string) || undefined;
      tags = (legacyConfig.tags as string[]) || [];

      dataset = datasetType
        ? await this.prisma.dataset.findFirst({ where: { type: datasetType } })
        : await this.prisma.dataset.findFirst();
    }

    if (!dataset) {
      throw new NotFoundException(
        `Dataset configuration not found for template ID: ${template.id}`,
      );
    }

    // Build filter for DatasetItem
    const where: Record<string, unknown> = {};
    if (topic) where["topic"] = topic;
    if (difficulty) where["difficulty"] = difficulty;
    if (tags.length > 0) where["tags"] = { hasSome: tags };

    // Find a matching item — pick a random one
    const items = await this.prisma.datasetItem.findMany({
      where: { datasetId: dataset.id, ...where },
      take: 20,
    });

    if (items.length === 0) {
      throw new NotFoundException(
        `No dataset items found matching filters: ${JSON.stringify(where)}`,
      );
    }

    const item = items[Math.floor(Math.random() * items.length)];

    const payload: DatasetPayload = {
      passage: item.content,
      datasetMetadata: {
        datasetId: dataset.id,
        itemId: item.id,
        topic: item.topic,
        difficulty: item.difficulty,
        tags: item.tags,
      },
    };

    return {
      strategy: "DATASET",
      payload,
      metadata: {
        templateId: template.id,
        datasetName: dataset.name,
        datasetType: dataset.type,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}
