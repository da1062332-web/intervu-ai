import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

export interface TopicRegistryItem {
  id: string;
  domain: string;
  topic: string;
  subtopic: string;
  concepts: string[];
  tags: string[];
  difficultySupport: {
    easy: boolean;
    medium: boolean;
    hard: boolean;
  };
}

@Injectable()
export class TopicRegistryLoader implements OnModuleInit {
  private registryCache = new Map<string, TopicRegistryItem>();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.loadTopics();
  }

  async loadTopics(): Promise<TopicRegistryItem[]> {
    try {
      const dbTopics = await this.prisma.topic.findMany({
        where: {
          deletedAt: null,
          isActive: true,
        },
        include: {
          conceptMappings: {
            where: {
              deletedAt: null,
              isActive: true,
            },
          },
        },
      });

      const items: TopicRegistryItem[] = dbTopics.map((t) => ({
        id: t.id,
        domain: t.domain,
        topic: t.topicName,
        subtopic: t.subtopic,
        concepts: t.conceptMappings.map((cm) => cm.conceptName),
        tags: t.tags,
        difficultySupport: {
          easy: t.easySupport,
          medium: t.mediumSupport,
          hard: t.hardSupport,
        },
      }));

      this.registryCache.clear();
      for (const item of items) {
        this.registryCache.set(item.id, item);
      }
      return items;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load topic registry from database: ${message}`);
    }
  }

  async getTopicById(id: string): Promise<TopicRegistryItem | null> {
    return this.registryCache.get(id) ?? null;
  }

  async getAllTopics(): Promise<TopicRegistryItem[]> {
    return Array.from(this.registryCache.values());
  }
}
