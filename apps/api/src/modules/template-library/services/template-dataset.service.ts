import { Injectable, NotFoundException } from "@nestjs/common";
import { TemplateDatasetRepository } from "../repositories/template-dataset.repository";
import { TemplateRepository } from "../repositories/template.repository";
import { UpdateTemplateDatasetConfigDto } from "@intervu/shared";

@Injectable()
export class TemplateDatasetService {
  constructor(
    private readonly templateDatasetRepo: TemplateDatasetRepository,
    private readonly templateRepo: TemplateRepository,
  ) {}

  async getDatasetConfig(templateId: string) {
    const template = await this.templateRepo.findById(templateId);
    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    const config = await this.templateDatasetRepo.findByTemplateId(templateId);
    return config || null;
  }

  async saveDatasetConfig(
    templateId: string,
    dto: UpdateTemplateDatasetConfigDto,
  ) {
    const template = await this.templateRepo.findById(templateId);
    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    const existing =
      await this.templateDatasetRepo.findByTemplateId(templateId);
    if (existing) {
      return this.templateDatasetRepo.update(existing.id, {
        datasetId: dto.datasetId,
        selectionMethod: dto.selectionMethod,
        difficultyOverride: dto.difficultyOverride,
        topicOverride: dto.topicOverride,
        tags: dto.tags,
      });
    }

    return this.templateDatasetRepo.create({
      datasetId: dto.datasetId,
      selectionMethod: dto.selectionMethod || "RANDOM",
      difficultyOverride: dto.difficultyOverride,
      topicOverride: dto.topicOverride,
      tags: dto.tags || [],
      template: { connect: { id: templateId } },
    });
  }
}
