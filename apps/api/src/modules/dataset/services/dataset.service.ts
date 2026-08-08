import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  CreateDatasetDto,
  UpdateDatasetDto,
  CreateDatasetItemDto,
} from "../dto/dataset.dto";

@Injectable()
export class DatasetService {
  constructor(private readonly prismaService: PrismaService) {}

  async createDataset(dto: CreateDatasetDto) {
    const existing = await this.prismaService.dataset.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new BadRequestException(
        `Dataset with name "${dto.name}" already exists`,
      );
    }
    return this.prismaService.dataset.create({
      data: dto,
    });
  }

  async findAllDatasets() {
    return this.prismaService.dataset.findMany({
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
  }

  async findDatasetById(id: string) {
    const dataset = await this.prismaService.dataset.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!dataset) {
      throw new NotFoundException(`Dataset with ID "${id}" not found`);
    }
    return dataset;
  }

  async updateDataset(id: string, dto: UpdateDatasetDto) {
    await this.findDatasetById(id); // ensure exists
    return this.prismaService.dataset.update({
      where: { id },
      data: dto,
    });
  }

  async deleteDataset(id: string) {
    await this.findDatasetById(id); // ensure exists
    return this.prismaService.dataset.delete({
      where: { id },
    });
  }

  async addDatasetItem(datasetId: string, dto: CreateDatasetItemDto) {
    await this.findDatasetById(datasetId); // ensure exists
    const questionText = dto.questionText || dto.content || "";
    const content = dto.content || dto.questionText || "";

    if (dto.options && dto.options.length > 0 && dto.answer) {
      const match = dto.options.some(
        (o) => o.trim().toLowerCase() === dto.answer?.trim().toLowerCase(),
      );
      if (!match) {
        throw new BadRequestException(
          `Correct answer "${dto.answer}" must match one of the provided options: [${dto.options.join(", ")}]`,
        );
      }
    }

    return this.prismaService.datasetItem.create({
      data: {
        datasetId,
        questionText,
        content,
        options: dto.options || [],
        answer: dto.answer || null,
        explanation: dto.explanation || null,
        difficulty: dto.difficulty || "MEDIUM",
        tags: dto.tags || [],
        metadata: dto.metadata || {},
      },
    });
  }

  async addDatasetItemsBulk(datasetId: string, dtos: CreateDatasetItemDto[]) {
    await this.findDatasetById(datasetId); // ensure exists
    const data = dtos.map((dto, idx) => {
      const questionText = dto.questionText || dto.content || "";
      const content = dto.content || dto.questionText || "";

      if (dto.options && dto.options.length > 0 && dto.answer) {
        const match = dto.options.some(
          (o) => o.trim().toLowerCase() === dto.answer?.trim().toLowerCase(),
        );
        if (!match) {
          throw new BadRequestException(
            `Item ${idx + 1}: Correct answer "${dto.answer}" must match one of the provided options: [${dto.options.join(", ")}]`,
          );
        }
      }

      return {
        datasetId,
        questionText,
        content,
        options: dto.options || [],
        answer: dto.answer || null,
        explanation: dto.explanation || null,
        difficulty: dto.difficulty || "MEDIUM",
        tags: dto.tags || [],
        metadata: dto.metadata || {},
      };
    });
    return this.prismaService.datasetItem.createMany({
      data,
    });
  }

  async deleteDatasetItem(itemId: string) {
    const item = await this.prismaService.datasetItem.findUnique({
      where: { id: itemId },
    });
    if (!item) {
      throw new NotFoundException(`DatasetItem with ID "${itemId}" not found`);
    }
    return this.prismaService.datasetItem.delete({
      where: { id: itemId },
    });
  }

  async findDatasetItemById(itemId: string) {
    const item = await this.prismaService.datasetItem.findUnique({
      where: { id: itemId },
    });
    if (!item) {
      throw new NotFoundException(`DatasetItem with ID "${itemId}" not found`);
    }
    return item;
  }

  async updateDatasetItem(itemId: string, dto: any) {
    await this.findDatasetItemById(itemId); // ensure exists
    return this.prismaService.datasetItem.update({
      where: { id: itemId },
      data: dto,
    });
  }

  async getDatasetSchema(datasetId: string) {
    await this.findDatasetById(datasetId); // ensure exists
    const items = await this.prismaService.datasetItem.findMany({
      where: { datasetId },
      take: 10,
    });

    if (items.length === 0) {
      return { fields: [] };
    }

    const fieldMap = new Map<string, { types: Set<string>; count: number }>();

    for (const item of items) {
      const metadata = (item.metadata as Record<string, any>) || {};
      for (const [key, value] of Object.entries(metadata)) {
        if (!fieldMap.has(key)) {
          fieldMap.set(key, { types: new Set<string>(), count: 0 });
        }
        const info = fieldMap.get(key)!;
        info.count++;

        if (value === null || value === undefined) {
          info.types.add("NULL");
        } else if (Array.isArray(value)) {
          info.types.add("ARRAY");
        } else if (typeof value === "string") {
          info.types.add("STRING");
        } else if (typeof value === "number") {
          info.types.add("NUMBER");
        } else if (typeof value === "boolean") {
          info.types.add("BOOLEAN");
        } else {
          info.types.add("OBJECT");
        }
      }
    }

    const fields = Array.from(fieldMap.entries()).map(([name, info]) => {
      const typeList = Array.from(info.types).filter((t) => t !== "NULL");
      const determinedType = typeList.length > 0 ? typeList[0] : "STRING";
      return {
        name,
        type: determinedType,
        required: info.count === items.length,
      };
    });

    return { fields };
  }
}
