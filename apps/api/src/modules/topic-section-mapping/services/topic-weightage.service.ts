import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { TopicWeightageRepository } from "../repositories/topic-weightage.repository";
import { TopicSectionMappingRepository } from "../repositories/topic-section-mapping.repository";
import { ExamSectionRepository } from "../../admin-config/repositories/exam-section.repository";
import { ExamConfigRepository } from "../../admin-config/repositories/exam-config.repository";
import {
  SectionNotFoundError,
  WeightageNotFoundError,
  WeightageTotalInvalidError,
  TopicNotMappedToSectionError,
} from "@intervu/shared";
import { ConflictException } from "@nestjs/common";

@Injectable()
export class TopicWeightageService {
  private readonly logger = new Logger(TopicWeightageService.name);

  constructor(
    private readonly repository: TopicWeightageRepository,
    private readonly mappingRepository: TopicSectionMappingRepository,
    private readonly sectionRepo: ExamSectionRepository,
    private readonly configRepo: ExamConfigRepository,
  ) {}

  private async validateSectionAndGetConfig(sectionId: string) {
    const section = await this.sectionRepo.findById(sectionId);
    if (!section) {
      throw new SectionNotFoundError(`Section ${sectionId} not found`);
    }

    const config = await this.configRepo.findById(section.examConfigId);
    if (config && (config.isArchived || config.status === "ARCHIVED")) {
      throw new BadRequestException({
        code: "CONFIG_ARCHIVED",
        error: "CONFIG_ARCHIVED",
        message: "Archived configurations cannot be modified",
      });
    }
    return section;
  }

  async addWeightage(sectionId: string, topicId: string, percentage: number) {
    // 1. Validate section exists and is active
    await this.validateSectionAndGetConfig(sectionId);

    // 2. Ensure topic is mapped to section
    const isMapped = await this.mappingRepository.exists(sectionId, topicId);
    if (!isMapped) {
      await this.mappingRepository.createMapping(sectionId, topicId);
    }

    // 3. Check for existing weightage
    const existing = await this.repository.findWeightageBySectionAndTopic(
      sectionId,
      topicId,
    );
    if (existing) {
      throw new ConflictException(
        `Weightage configuration already exists for topic ${topicId} in section ${sectionId}`,
      );
    }

    // 4. Validate sum does not exceed 100% - Removed to allow intermediate configuration states
    const currentSum = await this.repository.sumWeightagesBySection(sectionId);

    const weightage = await this.repository.createWeightage(
      sectionId,
      topicId,
      percentage,
    );
    this.logger.log(
      `Weightage assigned: topic ${topicId} got ${percentage}% in section ${sectionId}`,
    );
    return weightage;
  }

  async getWeightages(sectionId: string) {
    const section = await this.sectionRepo.findById(sectionId);
    if (!section) {
      return [];
    }
    return this.repository.findWeightagesBySection(sectionId);
  }

  async updateWeightage(weightageId: string, percentage: number) {
    // 1. Fetch existing weightage
    const existing = await this.repository.findWeightageById(weightageId);
    if (!existing) {
      throw new WeightageNotFoundError(
        `Weightage configuration with ID ${weightageId} not found`,
      );
    }

    // 2. Validate section & archive config
    await this.validateSectionAndGetConfig(existing.sectionId);

    // 3. Removed > 100% check to allow intermediate configuration states
    const currentSum = await this.repository.sumWeightagesBySection(
      existing.sectionId,
    );
    const newSum = currentSum - existing.weightagePercentage + percentage;

    const updated = await this.repository.updateWeightage(
      weightageId,
      percentage,
    );
    this.logger.log(
      `Weightage updated: ID ${weightageId} set to ${percentage}%`,
    );
    return updated;
  }

  async deleteWeightage(weightageId: string) {
    // 1. Fetch existing weightage
    const existing = await this.repository.findWeightageById(weightageId);
    if (!existing) {
      throw new WeightageNotFoundError(
        `Weightage configuration with ID ${weightageId} not found`,
      );
    }

    // 2. Validate section & archive config
    await this.validateSectionAndGetConfig(existing.sectionId);

    await this.repository.deleteWeightage(weightageId);
    this.logger.log(`Weightage configuration deleted: ID ${weightageId}`);
  }

  async validateSectionTotalWeightage(sectionId: string): Promise<void> {
    const total = await this.repository.sumWeightagesBySection(sectionId);
    if (total !== 100) {
      throw new WeightageTotalInvalidError(
        `Total section weightage must be exactly 100% (current: ${total}%)`,
      );
    }
  }
}
