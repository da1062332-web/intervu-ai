import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
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
  private readonly logger = new Logger(TopicRegistryLoader.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.loadWithRetries(5, 1000);
  }

  private async loadWithRetries(maxRetries: number, delayMs: number) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.loadTopics();
        this.logger.log("Topic registry loaded successfully from database.");
        return;
      } catch (error) {
        this.logger.warn(
          `Failed to load topic registry (attempt ${attempt}/${maxRetries}): ${error instanceof Error ? error.message : String(error)}`,
        );
        if (attempt < maxRetries) {
          const backoffDelay = delayMs * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        } else {
          this.logger.error(
            "Database unreachable. Failed to load topic registry after maximum retries. Application will continue, but registry will be loaded on demand.",
          );
        }
      }
    }
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
    let item = this.registryCache.get(id);
    if (!item) {
      await this.loadTopics();
      item = this.registryCache.get(id);
    }
    return item ?? null;
  }

  async getAllTopics(): Promise<TopicRegistryItem[]> {
    return Array.from(this.registryCache.values());
  }
}
