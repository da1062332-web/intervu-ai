import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { TopicRepository } from "../repositories/topic.repository";
import { CreateTopicDto, UpdateTopicDto } from "@intervu/shared";
import { TopicRegistryLoader } from "./topic-registry-loader.service";
import { TopicStatus } from "@prisma/client";

@Injectable()
export class TopicService {
  constructor(
    private readonly repository: TopicRepository,
    private readonly registryLoader: TopicRegistryLoader,
  ) {}

  async createTopic(dto: CreateTopicDto) {
    const codeUpper = dto.code.toUpperCase();
    const existing = await this.repository.findByCode(codeUpper);
    if (existing) {
      throw new ConflictException(`Topic with code ${dto.code} already exists`);
    }

    const topic = await this.repository.create({
      name: dto.name,
      code: codeUpper,
      description: dto.description,
      status: (dto.status as TopicStatus) || TopicStatus.ACTIVE,
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
    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }
    return topic;
  }

  async updateTopic(id: string, dto: UpdateTopicDto) {
    // Verify topic exists
    const existingTopic = await this.getTopic(id);

    if (dto.code !== undefined) {
      const codeUpper = dto.code.toUpperCase();
      if (codeUpper !== existingTopic.code) {
        const existing = await this.repository.findByCode(codeUpper);
        if (existing && existing.id !== id) {
          throw new ConflictException(
            `Topic with code ${dto.code} already exists`,
          );
        }
      }
    }

    const updated = await this.repository.update(id, {
      name: dto.name,
      code: dto.code ? dto.code.toUpperCase() : undefined,
      description: dto.description,
      status: dto.status as TopicStatus,
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
