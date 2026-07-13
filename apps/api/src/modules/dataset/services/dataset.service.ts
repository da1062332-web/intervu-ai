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
    return this.prismaService.datasetItem.create({
      data: {
        datasetId,
        content: dto.content,
        difficulty: dto.difficulty,
        topic: dto.topic,
        tags: dto.tags,
        metadata: dto.metadata || {},
      },
    });
  }

  async addDatasetItemsBulk(datasetId: string, dtos: CreateDatasetItemDto[]) {
    await this.findDatasetById(datasetId); // ensure exists
    const data = dtos.map((dto) => ({
      datasetId,
      content: dto.content,
      difficulty: dto.difficulty,
      topic: dto.topic,
      tags: dto.tags,
      metadata: dto.metadata || {},
    }));
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
}
