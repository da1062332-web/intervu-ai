import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { TopicSectionMappingRepository } from "../repositories/topic-section-mapping.repository";
import { TopicRegistryLoader } from "../../concept-mapping/services/topic-registry-loader.service";
import { TopicRepository } from "../../concept-mapping/repositories/topic.repository";
import { ExamSectionRepository } from "../../admin-config/repositories/exam-section.repository";
import { ExamConfigRepository } from "../../admin-config/repositories/exam-config.repository";
import { SectionTopicResponse } from "@intervu-ai/contracts";
import { ExamSection, TopicStatus } from "@prisma/client";
import {
  TopicNotFoundError,
  TopicAlreadyMappedError,
  SectionTopicMappingNotFoundError,
  SectionNotFoundError,
} from "@intervu/shared";

import { ExamConfigUsageService } from "../../question-bank/services/exam-config-usage.service";

@Injectable()
export class TopicSectionMappingService {
  private readonly logger = new Logger(TopicSectionMappingService.name);

  constructor(
    private readonly repository: TopicSectionMappingRepository,
    private readonly topicRegistry: TopicRegistryLoader,
    private readonly topicRepo: TopicRepository,
    private readonly sectionRepo: ExamSectionRepository,
    private readonly configRepo: ExamConfigRepository,
    private readonly usageService: ExamConfigUsageService,
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
    await this.validateSectionExists(sectionId);

    const mappings = await this.repository.findMappingsBySection(sectionId);
    if (mappings.length === 0) {
      return [];
    }

    const responses: SectionTopicResponse[] = [];
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
    const section = await this.validateSectionExists(sectionId);

    const topic = await this.topicRepo.findById(topicId);
    if (!topic || topic.status !== TopicStatus.ACTIVE) {
      throw new TopicNotFoundError(`Topic ${topicId} not found or is inactive`);
    }

    const exists = await this.repository.exists(sectionId, topicId);
    if (exists) {
      throw new TopicAlreadyMappedError();
    }

    // CHECK UNUSED QUESTION POOL CAPACITY FOR THIS TOPIC & EXAM CONFIG
    const unusedCount = await this.usageService.getUnusedPoolCount(
      section.examConfigId,
      topicId,
      undefined,
    );

    if (unusedCount <= 0) {
      const conflictingConfigs =
        await this.usageService.findConflictingConfigsForTopic(
          section.examConfigId,
          topicId,
        );

      if (conflictingConfigs.length > 0) {
        throw new BadRequestException({
          code: "TOPIC_QUESTIONS_EXHAUSTED",
          error: "TOPIC_QUESTIONS_EXHAUSTED",
          message: `Cannot assign topic '${topic.name}' to this section. All questions for topic '${topic.name}' are already assigned to Exam Configuration(s): '${conflictingConfigs.join(", ")}'. Please generate a new batch of questions for topic '${topic.name}' before assigning it to this section.`,
          details: {
            topicId,
            topicName: topic.name,
            conflictingConfigs,
            shortcutUrl: `/admin/question-generation?topicId=${topicId}`,
          },
        });
      } else {
        throw new BadRequestException({
          code: "TOPIC_QUESTIONS_EMPTY",
          error: "TOPIC_QUESTIONS_EMPTY",
          message: `Cannot assign topic '${topic.name}' to this section. Topic '${topic.name}' has 0 active questions in the Question Bank. Please generate questions for topic '${topic.name}' before assigning it to this section.`,
          details: {
            topicId,
            topicName: topic.name,
            shortcutUrl: `/admin/question-generation?topicId=${topicId}`,
          },
        });
      }
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
