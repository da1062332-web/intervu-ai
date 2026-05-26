import Redis, { Redis as RedisType } from 'ioredis';
import { AppLogger } from '@intervu-ai/shared-logger';

export class RedisConnectionManager {
  private static instance: RedisType | null = null;
  private static logger: AppLogger;

  private constructor() {}

  static setLogger(logger: AppLogger): void {
    RedisConnectionManager.logger = logger;
  }

  static async connect(redisUrl: string): Promise<RedisType> {
    if (RedisConnectionManager.instance) {
      return RedisConnectionManager.instance;
    }

    try {
      const redis = new Redis(redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
        enableOfflineQueue: true,
      });

      redis.on('connect', () => {
        if (RedisConnectionManager.logger) {
          RedisConnectionManager.logger.info('Connected to Redis');
        }
      });

      redis.on('error', (error) => {
        if (RedisConnectionManager.logger) {
          RedisConnectionManager.logger.error('Redis connection error', error);
        }
      });

      redis.on('close', () => {
        if (RedisConnectionManager.logger) {
          RedisConnectionManager.logger.warn('Redis connection closed');
        }
      });

      // Test connection
      await redis.ping();

      RedisConnectionManager.instance = redis;
      return redis;
    } catch (error) {
      if (RedisConnectionManager.logger) {
        RedisConnectionManager.logger.error('Failed to connect to Redis', error);
      }
      throw error;
    }
  }

  static getInstance(): RedisType {
    if (!RedisConnectionManager.instance) {
      throw new Error('Redis not connected. Call connect() first.');
    }
    return RedisConnectionManager.instance;
  }

  static async disconnect(): Promise<void> {
    if (RedisConnectionManager.instance) {
      await RedisConnectionManager.instance.quit();
      RedisConnectionManager.instance = null;
      if (RedisConnectionManager.logger) {
        RedisConnectionManager.logger.info('Disconnected from Redis');
      }
    }
  }

  static isConnected(): boolean {
    return RedisConnectionManager.instance !== null && RedisConnectionManager.instance.status === 'ready';
  }
}
