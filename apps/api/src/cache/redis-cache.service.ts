import { RedisConnectionManager } from './redis-connection.manager';
import { AppLogger } from '@intervu-ai/shared-logger';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

export class RedisCacheService {
  private readonly DEFAULT_TTL = 3600; // 1 hour
  private logger: AppLogger;

  constructor(logger: AppLogger) {
    this.logger = logger;
  }

  private getKey(key: string, prefix?: string): string {
    if (prefix) {
      return `${prefix}:${key}`;
    }
    return key;
  }

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      const redis = RedisConnectionManager.getInstance();
      const fullKey = this.getKey(key, options?.prefix);

      const value = await redis.get(fullKey);
      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error('Failed to get cache', error, { key });
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    try {
      const redis = RedisConnectionManager.getInstance();
      const fullKey = this.getKey(key, options?.prefix);
      const ttl = options?.ttl || this.DEFAULT_TTL;

      const serialized = JSON.stringify(value);
      await redis.setex(fullKey, ttl, serialized);
      return true;
    } catch (error) {
      this.logger.error('Failed to set cache', error, { key });
      return false;
    }
  }

  async delete(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      const redis = RedisConnectionManager.getInstance();
      const fullKey = this.getKey(key, options?.prefix);

      const result = await redis.del(fullKey);
      return result > 0;
    } catch (error) {
      this.logger.error('Failed to delete cache', error, { key });
      return false;
    }
  }

  async exists(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      const redis = RedisConnectionManager.getInstance();
      const fullKey = this.getKey(key, options?.prefix);

      const result = await redis.exists(fullKey);
      return result > 0;
    } catch (error) {
      this.logger.error('Failed to check cache existence', error, { key });
      return false;
    }
  }

  async setTTL(key: string, ttl: number, options?: CacheOptions): Promise<boolean> {
    try {
      const redis = RedisConnectionManager.getInstance();
      const fullKey = this.getKey(key, options?.prefix);

      const result = await redis.expire(fullKey, ttl);
      return result > 0;
    } catch (error) {
      this.logger.error('Failed to set TTL', error, { key });
      return false;
    }
  }

  async getTTL(key: string, options?: CacheOptions): Promise<number> {
    try {
      const redis = RedisConnectionManager.getInstance();
      const fullKey = this.getKey(key, options?.prefix);

      const ttl = await redis.ttl(fullKey);
      return ttl;
    } catch (error) {
      this.logger.error('Failed to get TTL', error, { key });
      return -1;
    }
  }

  async clear(pattern?: string): Promise<number> {
    try {
      const redis = RedisConnectionManager.getInstance();
      const scanPattern = pattern || '*';

      let cursor = 0;
      let deletedCount = 0;

      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', scanPattern);
        if (keys.length > 0) {
          deletedCount += await redis.del(...keys);
        }
        cursor = parseInt(nextCursor);
      } while (cursor !== 0);

      return deletedCount;
    } catch (error) {
      this.logger.error('Failed to clear cache', error, { pattern });
      return 0;
    }
  }

  // Question cache methods
  async getQuestion<T>(questionId: string): Promise<T | null> {
    return this.get<T>(questionId, { prefix: 'question' });
  }

  async setQuestion<T>(questionId: string, data: T, ttl?: number): Promise<boolean> {
    return this.set<T>(questionId, data, { prefix: 'question', ttl });
  }

  // Session cache methods
  async getSession<T>(sessionId: string): Promise<T | null> {
    return this.get<T>(sessionId, { prefix: 'session' });
  }

  async setSession<T>(sessionId: string, data: T, ttl?: number): Promise<boolean> {
    return this.set<T>(sessionId, data, { prefix: 'session', ttl });
  }

  // Assembly cache methods
  async getAssembly<T>(assemblyId: string): Promise<T | null> {
    return this.get<T>(assemblyId, { prefix: 'assembly' });
  }

  async setAssembly<T>(assemblyId: string, data: T, ttl?: number): Promise<boolean> {
    return this.set<T>(assemblyId, data, { prefix: 'assembly', ttl });
  }
}
