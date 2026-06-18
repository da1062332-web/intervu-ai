import { Injectable, Logger } from "@nestjs/common";
import { TopicSectionMappingRepository } from "../repositories/topic-section-mapping.repository";
import { TopicRegistryLoader } from "../../concept-mapping/services/topic-registry-loader.service";
import { SectionTopicResponse } from "@intervu-ai/contracts";
import {
  TopicNotFoundError,
  TopicAlreadyMappedError,
  SectionTopicMappingNotFoundError,
} from "@intervu/shared";

@Injectable()
export class TopicSectionMappingService {
  private readonly logger = new Logger(TopicSectionMappingService.name);

  constructor(
    private readonly repository: TopicSectionMappingRepository,
    private readonly topicRegistry: TopicRegistryLoader,
  ) {}

  async validateSectionExists(sectionId: string): Promise<void> {
    void sectionId;
    // TODO: Implement Section Registry integration when available.
    // If section does not exist, throw new SectionNotFoundError(`Section ${sectionId} not found`);
    // Example: const section = await this.sectionRegistry.getSectionById(sectionId);
    // if (!section) throw new SectionNotFoundError();
  }

  async getMappings(sectionId: string): Promise<SectionTopicResponse[]> {
    await this.validateSectionExists(sectionId);
    const mappings = await this.repository.findMappingsBySection(sectionId);

    if (mappings.length === 0) {
      return [];
    }

    const responses: SectionTopicResponse[] = [];

    // Batch lookup using existing TopicRegistryLoader
    const topics = await Promise.all(
      mappings.map((m: { topicId: string }) =>
        this.topicRegistry.getTopicById(m.topicId),
      ),
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

    const topic = await this.topicRegistry.getTopicById(topicId);
    if (!topic) {
      throw new TopicNotFoundError(`Topic ${topicId} not found in registry`);
    }

    const exists = await this.repository.exists(sectionId, topicId);
    if (exists) {
      throw new TopicAlreadyMappedError();
    }

    await this.repository.createMapping(sectionId, topicId);
    this.logger.log(`Topic assigned: ${topicId} to section: ${sectionId}`);
  }

  async removeTopic(sectionId: string, topicId: string): Promise<void> {
    const exists = await this.repository.exists(sectionId, topicId);
    if (!exists) {
      throw new SectionTopicMappingNotFoundError();
    }

    await this.repository.removeMapping(sectionId, topicId);
    this.logger.log(`Topic removed: ${topicId} from section: ${sectionId}`);
  }
}
