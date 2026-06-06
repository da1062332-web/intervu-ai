import { RedisConnectionManager } from "./redis-connection.manager";
import { AppLogger } from "@intervu-ai/shared-logger";

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

// ─── TTL Constants ────────────────────────────────────────────────────────────
const TTL = {
  DEFAULT: 3600, // 1 hour
  TEMPLATE_ITEM: 3600, // 1 hour per individual template
  TEMPLATE_LIST: 1800, // 30 min for list queries
  TEMPLATE_SYSTEM: 86400, // 24 hours for system templates
  TEMPLATE_DIFFICULTY: 3600, // 1 hour per difficulty bucket
  GENERATION_RESULT: 7200, // 2 hours for completed generation results
} as const;

export class RedisCacheService {
  private readonly logger: AppLogger;

  constructor(logger: AppLogger) {
    this.logger = logger;
  }

  // ─── Internal Helpers ────────────────────────────────────────────────────────

  private getKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}:${key}` : key;
  }

  /**
   * Guard: returns false when Redis is unavailable.
   * This prevents hard throws from propagating and keeps the app
   * running in degraded (DB-only) mode.
   */
  private isAvailable(): boolean {
    return RedisConnectionManager.isConnected();
  }

  // ─── Core CRUD ───────────────────────────────────────────────────────────────

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    if (!this.isAvailable()) {
      this.logger.debug("Redis unavailable — cache miss (degraded mode)", {
        key,
      });
      return null;
    }
    try {
      const redis = RedisConnectionManager.getInstance();
      const fullKey = this.getKey(key, options?.prefix);
      const value = await redis.get(fullKey);
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      this.logger.error("Failed to get cache", error, { key });
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    options?: CacheOptions,
  ): Promise<boolean> {
    if (!this.isAvailable()) {
      this.logger.debug(
        "Redis unavailable — cache set skipped (degraded mode)",
        { key },
      );
      return false;
    }
    try {
      const redis = RedisConnectionManager.getInstance();
      const fullKey = this.getKey(key, options?.prefix);
      const ttl = options?.ttl ?? TTL.DEFAULT;
      const serialized = JSON.stringify(value);
      await redis.setex(fullKey, ttl, serialized);
      return true;
    } catch (error) {
      this.logger.error("Failed to set cache", error, { key });
      return false;
    }
  }

  async delete(key: string, options?: CacheOptions): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }
    try {
      const redis = RedisConnectionManager.getInstance();
      const fullKey = this.getKey(key, options?.prefix);
      const result = await redis.del(fullKey);
      return result > 0;
    } catch (error) {
      this.logger.error("Failed to delete cache", error, { key });
      return false;
    }
  }

  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }
    try {
      const redis = RedisConnectionManager.getInstance();
      const fullKey = this.getKey(key, options?.prefix);
      const result = await redis.exists(fullKey);
      return result > 0;
    } catch (error) {
      this.logger.error("Failed to check cache existence", error, { key });
      return false;
    }
  }

  async setTTL(
    key: string,
    ttl: number,
    options?: CacheOptions,
  ): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }
    try {
      const redis = RedisConnectionManager.getInstance();
      const fullKey = this.getKey(key, options?.prefix);
      const result = await redis.expire(fullKey, ttl);
      return result > 0;
    } catch (error) {
      this.logger.error("Failed to set TTL", error, { key });
      return false;
    }
  }

  async getTTL(key: string, options?: CacheOptions): Promise<number> {
    if (!this.isAvailable()) {
      return -1;
    }
    try {
      const redis = RedisConnectionManager.getInstance();
      const fullKey = this.getKey(key, options?.prefix);
      return await redis.ttl(fullKey);
    } catch (error) {
      this.logger.error("Failed to get TTL", error, { key });
      return -1;
    }
  }

  async clear(pattern?: string): Promise<number> {
    if (!this.isAvailable()) {
      return 0;
    }
    try {
      const redis = RedisConnectionManager.getInstance();
      const scanPattern = pattern ?? "*";
      let cursor = 0;
      let deletedCount = 0;
      do {
        const [nextCursor, keys] = await redis.scan(
          cursor,
          "MATCH",
          scanPattern,
        );
        if (keys.length > 0) {
          deletedCount += await redis.del(...keys);
        }
        cursor = parseInt(nextCursor, 10);
      } while (cursor !== 0);
      return deletedCount;
    } catch (error) {
      this.logger.error("Failed to clear cache", error, { pattern });
      return 0;
    }
  }

  // ─── Domain: Question Cache ───────────────────────────────────────────────────

  async getQuestion<T>(questionId: string): Promise<T | null> {
    return this.get<T>(questionId, { prefix: "question" });
  }

  async setQuestion<T>(
    questionId: string,
    data: T,
    ttl?: number,
  ): Promise<boolean> {
    return this.set<T>(questionId, data, { prefix: "question", ttl });
  }

  // ─── Domain: Session Cache ────────────────────────────────────────────────────

  async getSession<T>(sessionId: string): Promise<T | null> {
    return this.get<T>(sessionId, { prefix: "session" });
  }

  async setSession<T>(
    sessionId: string,
    data: T,
    ttl?: number,
  ): Promise<boolean> {
    return this.set<T>(sessionId, data, { prefix: "session", ttl });
  }

  // ─── Domain: Assembly Cache ───────────────────────────────────────────────────

  async getAssembly<T>(assemblyId: string): Promise<T | null> {
    return this.get<T>(assemblyId, { prefix: "assembly" });
  }

  async setAssembly<T>(
    assemblyId: string,
    data: T,
    ttl?: number,
  ): Promise<boolean> {
    return this.set<T>(assemblyId, data, { prefix: "assembly", ttl });
  }

  // ─── Domain: Template Cache ───────────────────────────────────────────────────

  async getTemplate<T>(templateId: string): Promise<T | null> {
    return this.get<T>(templateId, { prefix: "template" });
  }

  async setTemplate<T>(
    templateId: string,
    data: T,
    ttl?: number,
  ): Promise<boolean> {
    return this.set<T>(templateId, data, {
      prefix: "template",
      ttl: ttl ?? TTL.TEMPLATE_ITEM,
    });
  }

  async getSystemTemplates<T>(): Promise<T | null> {
    return this.get<T>("system", { prefix: "template" });
  }

  async setSystemTemplates<T>(data: T): Promise<boolean> {
    return this.set<T>("system", data, {
      prefix: "template",
      ttl: TTL.TEMPLATE_SYSTEM,
    });
  }

  async getTemplatesByDifficulty<T>(difficulty: string): Promise<T | null> {
    return this.get<T>(difficulty, { prefix: "template:difficulty" });
  }

  async setTemplatesByDifficulty<T>(
    difficulty: string,
    data: T,
  ): Promise<boolean> {
    return this.set<T>(difficulty, data, {
      prefix: "template:difficulty",
      ttl: TTL.TEMPLATE_DIFFICULTY,
    });
  }

  async getTemplateList<T>(filterHash: string): Promise<T | null> {
    return this.get<T>(filterHash, { prefix: "template:list" });
  }

  async setTemplateList<T>(filterHash: string, data: T): Promise<boolean> {
    return this.set<T>(filterHash, data, {
      prefix: "template:list",
      ttl: TTL.TEMPLATE_LIST,
    });
  }

  /**
   * Invalidates all template-related cache keys for a given template ID.
   * Called on update and delete operations.
   */
  async invalidateTemplate(templateId: string): Promise<void> {
    await Promise.all([
      this.delete(templateId, { prefix: "template" }),
      this.clear("template:list:*"),
      this.clear("template:difficulty:*"),
    ]);
  }

  /**
   * Invalidates the system templates cache.
   * Called when a system template is created/updated/deleted.
   */
  async invalidateSystemTemplates(): Promise<void> {
    await Promise.all([
      this.delete("system", { prefix: "template" }),
      this.clear("template:list:*"),
    ]);
  }

  // ─── Domain: Generation Result Cache ─────────────────────────────────────────

  async getGenerationResult<T>(jobId: string): Promise<T | null> {
    return this.get<T>(jobId, { prefix: "generation" });
  }

  async setGenerationResult<T>(jobId: string, data: T): Promise<boolean> {
    return this.set<T>(jobId, data, {
      prefix: "generation",
      ttl: TTL.GENERATION_RESULT,
    });
  }

  // ─── Domain: Execution Cache ──────────────────────────────────────────────────

  async getExecution<T>(executionId: string): Promise<T | null> {
    return this.get<T>(executionId, { prefix: "execution" });
  }

  async setExecution<T>(
    executionId: string,
    data: T,
    ttl?: number,
  ): Promise<boolean> {
    return this.set<T>(executionId, data, { prefix: "execution", ttl });
  }

  async hasExecutionForTest(testId: string): Promise<boolean> {
    return this.exists(testId, { prefix: "execution:test" });
  }

  async setExecutionForTest(
    testId: string,
    executionId: string,
    ttl?: number,
  ): Promise<boolean> {
    return this.set<string>(testId, executionId, {
      prefix: "execution:test",
      ttl,
    });
  }
}
