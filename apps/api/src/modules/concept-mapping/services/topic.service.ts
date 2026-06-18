import { Injectable, NotFoundException } from "@nestjs/common";
import { TopicRepository } from "../repositories/topic.repository";
import { CreateTopicDto, UpdateTopicDto } from "@intervu/shared";
import { TopicRegistryLoader } from "./topic-registry-loader.service";

@Injectable()
export class TopicService {
  constructor(
    private readonly repository: TopicRepository,
    private readonly registryLoader: TopicRegistryLoader,
  ) {}

  async createTopic(dto: CreateTopicDto) {
    const topic = await this.repository.create({
      domain: dto.domain,
      topicName: dto.topicName,
      subtopic: dto.subtopic,
      tags: dto.tags,
      easySupport: dto.easySupport,
      mediumSupport: dto.mediumSupport,
      hardSupport: dto.hardSupport,
    });

    // Refresh the in-memory loader cache
    await this.registryLoader.loadTopics();

    return topic;
  }

  async getTopics(activeOnly = true) {
    return this.repository.findManyActive(activeOnly);
  }

  async getTopic(id: string) {
    const topic = await this.repository.findById(id);
    if (!topic || topic.deletedAt) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }
    return topic;
  }

  async updateTopic(id: string, dto: UpdateTopicDto) {
    // Verify topic exists
    await this.getTopic(id);

    const updated = await this.repository.update(id, {
      domain: dto.domain,
      topicName: dto.topicName,
      subtopic: dto.subtopic,
      tags: dto.tags,
      easySupport: dto.easySupport,
      mediumSupport: dto.mediumSupport,
      hardSupport: dto.hardSupport,
      isActive: dto.isActive,
    });

    await this.registryLoader.loadTopics();
    return updated;
  }

  async deleteTopic(id: string) {
    await this.getTopic(id);
    await this.repository.delete(id);
    await this.registryLoader.loadTopics();
    return { success: true };
  }
}
