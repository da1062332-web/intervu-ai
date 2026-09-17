import { Queue, type ConnectionOptions, type QueueOptions } from "bullmq";

type QueueConfig = Omit<QueueOptions, "connection">;

export const QUEUE_CONFIG: Record<string, QueueConfig> = {
  generation: {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: {
        age: 3600, // 1 hour
      },
      removeOnFail: {
        age: 7200, // 2 hours
      },
    },
  },
  evaluation: {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: {
        age: 3600,
      },
      removeOnFail: {
        age: 7200,
      },
    },
  },
  analytics: {
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: {
        age: 1800, // 30 minutes
      },
      removeOnFail: {
        age: 14400, // 4 hours
      },
    },
  },
  validation: {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: {
        age: 1800, // 30 minutes
      },
      removeOnFail: {
        age: 7200, // 2 hours
      },
    },
  },
  "code-execution": {
    defaultJobOptions: {
      // Never auto-retry a candidate's code execution: a retry would silently
      // re-run their submission and could double-count attempts/time.
      // Failures surface immediately to the caller instead.
      attempts: 1,
      removeOnComplete: {
        age: 300, // 5 minutes — result is consumed synchronously by the caller
      },
      removeOnFail: {
        age: 1800, // 30 minutes, kept for debugging
      },
    },
  },
};

/**
 * Builds the ioredis connection options BullMQ needs from a REDIS_URL.
 * Shared by QueueModule (producers) and any in-process BullMQ Worker
 * (consumers) so both sides agree on retry/offline-queue behavior.
 */
export function buildQueueRedisConnection(redisUrl: string): ConnectionOptions {
  const parsed = new URL(redisUrl);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    password: parsed.password || undefined,
    retryStrategy: () => null as null,
    enableOfflineQueue: false,
  };
}

export class QueueFactory {
  private static queues: Map<string, Queue> = new Map();

  static createQueue(name: string, connection: ConnectionOptions): Queue {
    if (this.queues.has(name)) {
      return this.queues.get(name)!;
    }

    const config = QUEUE_CONFIG[name] || QUEUE_CONFIG.analytics;
    const queue = new Queue(name, {
      ...config,
      connection,
    });

    this.queues.set(name, queue);
    return queue;
  }

  static getQueue(name: string): Queue {
    const queue = this.queues.get(name);
    if (!queue) {
      throw new Error(
        `Queue "${name}" not found. Create it first using createQueue().`,
      );
    }
    return queue;
  }

  static getQueues(): Map<string, Queue> {
    return this.queues;
  }

  static async closeAll(): Promise<void> {
    const promises = Array.from(this.queues.values()).map((queue) =>
      queue.close(),
    );
    await Promise.all(promises);
    this.queues.clear();
  }
}
