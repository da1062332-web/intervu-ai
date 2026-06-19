import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { TopicSectionMappingRepository } from "../repositories/topic-section-mapping.repository";
import { TopicRegistryLoader } from "../../concept-mapping/services/topic-registry-loader.service";
import { TopicRepository } from "../../concept-mapping/repositories/topic.repository";
import { ExamSectionRepository } from "../../admin-config/repositories/exam-section.repository";
import { ExamConfigRepository } from "../../admin-config/repositories/exam-config.repository";
import { SectionTopicResponse } from "@intervu-ai/contracts";
import { ExamSection } from "@prisma/client";
import {
  TopicNotFoundError,
  TopicAlreadyMappedError,
  SectionTopicMappingNotFoundError,
  SectionNotFoundError,
} from "@intervu/shared";

@Injectable()
export class TopicSectionMappingService {
  private readonly logger = new Logger(TopicSectionMappingService.name);

  constructor(
    private readonly repository: TopicSectionMappingRepository,
    private readonly topicRegistry: TopicRegistryLoader,
    private readonly topicRepo: TopicRepository,
    private readonly sectionRepo: ExamSectionRepository,
    private readonly configRepo: ExamConfigRepository,
  ) {}

  async validateSectionExists(sectionId: string): Promise<ExamSection> {
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

  async getMappings(sectionId: string): Promise<SectionTopicResponse[]> {
    const section = await this.sectionRepo.findById(sectionId);
    if (!section) {
      throw new SectionNotFoundError(`Section ${sectionId} not found`);
    }

    const mappings = await this.repository.findMappingsBySection(sectionId);
    if (mappings.length === 0) {
      return [];
    }

    const responses: SectionTopicResponse[] = [];
    const topics = await Promise.all(
      mappings.map((m: { topicId: string }) => this.topicRegistry.getTopicById(m.topicId)),
    );

    for (let i = 0; i < mappings.length; i++) {
      const topic = topics[i];
      if (topic) {
        responses.push({
          topicId: mappings[i].topicId,
          topicName: topic.topic,
          topicCode: topic.id,
          createdAt: mappings[i].createdAt,
        });
      } else {
        responses.push({
          topicId: mappings[i].topicId,
          topicName: "Unknown Topic",
          topicCode: "UNKNOWN",
          createdAt: mappings[i].createdAt,
        });
      }
    }

    return responses;
  }

  async assignTopic(sectionId: string, topicId: string): Promise<void> {
    await this.validateSectionExists(sectionId);

    const topic = await this.topicRepo.findById(topicId);
    if (!topic || !topic.isActive || topic.deletedAt !== null) {
      throw new TopicNotFoundError(`Topic ${topicId} not found or is inactive`);
    }

    const exists = await this.repository.exists(sectionId, topicId);
    if (exists) {
      throw new TopicAlreadyMappedError();
    }

    await this.repository.createMapping(sectionId, topicId);
    this.logger.log(`Topic assigned: ${topicId} to section: ${sectionId}`);

    // Invalidate/reload cache
    await this.topicRegistry.loadTopics();
  }

  async removeTopic(sectionId: string, topicId: string): Promise<void> {
    await this.validateSectionExists(sectionId);

    const exists = await this.repository.exists(sectionId, topicId);
    if (!exists) {
      throw new SectionTopicMappingNotFoundError();
    }

    await this.repository.removeMapping(sectionId, topicId);
    this.logger.log(`Topic removed: ${topicId} from section: ${sectionId}`);

    // Invalidate/reload cache
    await this.topicRegistry.loadTopics();
  }
}
