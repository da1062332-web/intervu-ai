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
      let filePath: string | null = null;

      // 1. Try finding relative to process.cwd() by walking up
      let currentDir = process.cwd();
      for (let i = 0; i < 5; i++) {
        const candidate = path.join(currentDir, "generation/topic-registry/software-engineering.json");
        try {
          await fs.access(candidate);
          filePath = candidate;
          break;
        } catch {
          const parent = path.dirname(currentDir);
          if (parent === currentDir) break;
          currentDir = parent;
        }
      }

      // 2. Try finding relative to __dirname by walking up if not found
      if (!filePath) {
        currentDir = __dirname;
        for (let i = 0; i < 7; i++) {
          const candidate = path.join(currentDir, "generation/topic-registry/software-engineering.json");
          try {
            await fs.access(candidate);
            filePath = candidate;
            break;
          } catch {
            const parent = path.dirname(currentDir);
            if (parent === currentDir) break;
            currentDir = parent;
          }
        }
      }

      // 3. Fallback to process.cwd() if still not found
      if (!filePath) {
        filePath = path.join(process.cwd(), "generation/topic-registry/software-engineering.json");
      }

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
