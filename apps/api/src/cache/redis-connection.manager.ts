import Redis, { Redis as RedisType } from "ioredis";
import { AppLogger } from "@intervu-ai/shared-logger";

export class RedisConnectionManager {
  private static instance: RedisType | null = null;
  private static logger: AppLogger;
  private static readonly defaultConnectTimeoutMs = 5000;

  private constructor() {}

  static setLogger(logger: AppLogger): void {
    RedisConnectionManager.logger = logger;
  }

  static async connect(
    redisUrl: string,
    timeoutMs: number = RedisConnectionManager.defaultConnectTimeoutMs,
  ): Promise<RedisType> {
    if (RedisConnectionManager.instance) {
      return RedisConnectionManager.instance;
    }

    const redis = new Redis(redisUrl, {
      /**
       * retryStrategy:
       * - While the instance is null the initial ping hasn't succeeded yet.
       *   Return null to tell ioredis to stop retrying immediately — the
       *   timeout branch or the catch block will clean up.
       * - Once instance is set (connect succeeded) back-off normally up to 2 s.
       *   This handles transient drops AFTER a successful startup connection.
       */
      retryStrategy: (times) => {
        if (!RedisConnectionManager.instance) {
          // Initial connection — stop retrying; the startup catch block handles this.
          return null;
        }
        // Post-connect transient failure — exponential back-off capped at 2 s.
        return Math.min(times * 50, 2000);
      },
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      enableOfflineQueue: true,
      connectTimeout: timeoutMs,
    });

    redis.on("connect", () => {
      if (RedisConnectionManager.logger) {
        RedisConnectionManager.logger.info("Connected to Redis");
      }
    });

    redis.on("error", (error) => {
      // Only log at warn level when running in degraded mode (instance not set)
      // to avoid flooding the console with AggregateError spam on every retry.
      if (RedisConnectionManager.logger) {
        if (RedisConnectionManager.instance) {
          RedisConnectionManager.logger.error("Redis connection error", error);
        } else {
          RedisConnectionManager.logger.warn(
            "Redis unavailable — running in degraded (cache-less) mode",
          );
        }
      }
    });

    redis.on("close", () => {
      if (RedisConnectionManager.logger) {
        RedisConnectionManager.logger.warn("Redis connection closed");
      }
    });

    let timeoutHandle: NodeJS.Timeout | null = null;
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`Redis connection timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      // Test the initial connection without blocking startup forever.
      await Promise.race([redis.ping(), timeoutPromise]);
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }

      RedisConnectionManager.instance = redis;
      return redis;
    } catch (error) {
      // Tear down the client fully so ioredis stops its internal reconnect loop.
      // Without this, the failed client keeps emitting ECONNREFUSED every few
      // seconds even though the app has already moved to degraded mode.
      redis.disconnect(false);
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
      if (RedisConnectionManager.logger) {
        RedisConnectionManager.logger.error(
          "Failed to connect to Redis",
          error,
        );
      }
      throw error;
    }
  }

  static getInstance(): RedisType {
    if (!RedisConnectionManager.instance) {
      throw new Error("Redis not connected. Call connect() first.");
    }
    return RedisConnectionManager.instance;
  }

  static async disconnect(): Promise<void> {
    if (RedisConnectionManager.instance) {
      await RedisConnectionManager.instance.quit();
      RedisConnectionManager.instance = null;
      if (RedisConnectionManager.logger) {
        RedisConnectionManager.logger.info("Disconnected from Redis");
      }
    }
  }

  static isConnected(): boolean {
    return (
      RedisConnectionManager.instance !== null &&
      RedisConnectionManager.instance.status === "ready"
    );
  }
}
