import { Injectable, OnModuleInit } from "@nestjs/common";
import * as fs from "fs/promises";
import * as path from "path";

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

  async onModuleInit() {
    await this.loadTopics();
  }

  async loadTopics(): Promise<TopicRegistryItem[]> {
    try {
      const filePath = path.join(
        process.cwd(),
        "generation/topic-registry/software-engineering.json",
      );
      const content = await fs.readFile(filePath, "utf-8");
      const items = JSON.parse(content) as TopicRegistryItem[];

      this.registryCache.clear();
      for (const item of items) {
        this.registryCache.set(item.id, item);
      }
      return items;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load topic registry: ${message}`);
    }
  }

  async getTopicById(id: string): Promise<TopicRegistryItem | null> {
    return this.registryCache.get(id) ?? null;
  }
}
