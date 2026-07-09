import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class DatasetLoaderService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Loads a random item from a specified dataset matching difficulty, topic, and tag rules.
   */
  async loadDatasetItem(template: {
    difficultyLevel: string;
    conceptKey: string;
    datasetConfig?: any;
  }): Promise<{ content: string; metadata: any }> {
    const config = template.datasetConfig || {};
    const datasetName = config.datasetName || "Vocabulary Synonym List";
    const tags = config.filters?.tags || [];

    // 1. Locate dataset
    const dataset = await this.prismaService.dataset.findFirst({
      where: {
        OR: [
          { name: datasetName },
          { type: config.datasetType },
        ],
      },
    });

    if (!dataset) {
      throw new NotFoundException(`Dataset with name/type "${datasetName}" not found`);
    }

    // 2. Query items matching topic, difficulty, and tags
    const queryConditions: any = {
      datasetId: dataset.id,
    };

    // Filter by difficulty if provided
    if (template.difficultyLevel) {
      queryConditions.difficulty = template.difficultyLevel.toUpperCase();
    }

    // Filter by tags if tags are specified
    if (tags.length > 0) {
      queryConditions.tags = {
        hasSome: tags,
      };
    }

    let items = await this.prismaService.datasetItem.findMany({
      where: queryConditions,
    });

    // Fallback: If no items match strict filters, query all items in dataset
    if (items.length === 0) {
      items = await this.prismaService.datasetItem.findMany({
        where: { datasetId: dataset.id },
      });
    }

    if (items.length === 0) {
      throw new NotFoundException(`No items found in dataset "${dataset.name}"`);
    }

    // 3. Randomly select one item
    const selected = items[Math.floor(Math.random() * items.length)];

    return {
      content: selected.content,
      metadata: selected.metadata as any,
    };
  }
}
