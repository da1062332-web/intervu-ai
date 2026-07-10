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
    const config = (template.datasetConfig as Record<string, unknown>) ?? {};

    const datasetType = (config.datasetType as string) || undefined;
    const topic = (config.topic as string) || undefined;
    const difficulty = (config.difficulty as string) || undefined;
    const tags = (config.tags as string[]) || [];

    // Build filter for DatasetItem
    const where: Record<string, unknown> = {};
    if (topic) where["topic"] = topic;
    if (difficulty) where["difficulty"] = difficulty;
    if (tags.length > 0) where["tags"] = { hasSome: tags };

    // Find dataset of the right type first
    const dataset = datasetType
      ? await this.prisma.dataset.findFirst({ where: { type: datasetType } })
      : await this.prisma.dataset.findFirst();

    if (!dataset) {
      throw new NotFoundException(
        `No dataset found for type: ${datasetType ?? "any"}`,
      );
    }

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
