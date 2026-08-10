import { Injectable, NotFoundException } from "@nestjs/common";
import { Template } from "@prisma/client";
import { PrismaService } from "../../../../prisma/prisma.service";
import { IQuestionGenerationStrategy } from "../../interfaces/generation-strategy.interface";
import {
  GenerationContext,
  DatasetData,
} from "../../interfaces/generation-context.interface";
import { DatasetLoaderService } from "../../../generation/services/dataset-loader.service";

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
      const legacyConfig =
        (template.datasetConfig as Record<string, unknown>) ?? {};
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

    // 2. Load dataset item using our advanced DatasetLoaderService
    const datasetLoader = new DatasetLoaderService(this.prisma);
    const item = await datasetLoader.loadDatasetItem({
      id: template.id,
      difficultyLevel: template.difficultyLevel,
      conceptKey: template.conceptKey,
      datasetConfig: template.datasetConfig,
    });

    // 3. Resolve Custom Variables from Mapping config
    const resolvedVariables: Record<string, any> = {};
    const mapping = (config?.variableMapping as Record<string, string>) || {};
    const itemMetadata = (item.metadata as Record<string, any>) || {};

    for (const [tplVar, dsField] of Object.entries(mapping)) {
      resolvedVariables[tplVar] = itemMetadata[dsField] ?? null;
    }

    const payload: DatasetData = {
      passage: item.content,
      datasetMetadata: {
        datasetId: dataset.id,
        itemId: item.id,
        topic: itemMetadata.topic || "",
        difficulty: itemMetadata.difficulty || "",
        tags: itemMetadata.tags || [],
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
        variables: resolvedVariables,
        lineage: {
          datasetId: dataset.id,
          datasetItemId: item.id,
          templateId: template.id,
          templateVersion: template.version,
          variablesUsed: resolvedVariables,
          mappingUsed: mapping,
          promptVersion: 1,
        },
      },
    };
  }
}
