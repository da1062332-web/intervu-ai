import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { TopicStatus, ConceptStatus } from "@prisma/client";

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
          status: TopicStatus.ACTIVE,
        },
        include: {
          concepts: {
            where: {
              status: ConceptStatus.ACTIVE,
            },
          },
        },
      });

      const items: TopicRegistryItem[] = dbTopics.map((t) => {
        const parts = (t.description || "").split(" - ");
        const domain = parts[0] || "Software Engineering";
        const subtopic = parts[1] || "";
        
        return {
          id: t.id,
          domain,
          topic: t.name,
          subtopic,
          concepts: t.concepts.map((c) => c.code),
          tags: [],
          difficultySupport: {
            easy: true,
            medium: true,
            hard: true,
          },
        };
      });

      this.registryCache.clear();
      for (const item of items) {
        this.registryCache.set(item.id, item);
      }
      return items;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to load topic registry from database: ${message}`,
      );
    }
  }

  async getTopicById(id: string): Promise<TopicRegistryItem | null> {
    return this.registryCache.get(id) ?? null;
  }

  async getAllTopics(): Promise<TopicRegistryItem[]> {
    return Array.from(this.registryCache.values());
  }
}
