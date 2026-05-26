/**
 * Cache Key Contracts for Redis
 * Defines standard key formats for caching different data types
 */

export const CACHE_KEY_PATTERNS = {
  // Question cache: question:{id}
  QUESTION: (id: string) => `question:${id}`,

  // Session cache: session:{id}
  SESSION: (id: string) => `session:${id}`,

  // Assembly cache: assembly:{id}
  ASSEMBLY: (id: string) => `assembly:${id}`,

  // Test cache: test:{id}
  TEST: (id: string) => `test:${id}`,

  // User cache: user:{id}
  USER: (id: string) => `user:${id}`,

  // Template cache: template:{id}
  TEMPLATE: (id: string) => `template:${id}`,

  // Job results: job:result:{jobId}
  JOB_RESULT: (jobId: string) => `job:result:${jobId}`,

  // Job metadata: job:meta:{jobId}
  JOB_METADATA: (jobId: string) => `job:meta:${jobId}`,

  // Rate limit cache: ratelimit:{userId}:{endpoint}
  RATE_LIMIT: (userId: string, endpoint: string) => `ratelimit:${userId}:${endpoint}`,

  // Session tokens: token:{token}
  SESSION_TOKEN: (token: string) => `token:${token}`,

  // Refresh tokens: refresh:{userId}
  REFRESH_TOKEN: (userId: string) => `refresh:${userId}`,
};

/**
 * Default TTL (Time-to-Live) values in seconds
 */
export const CACHE_TTL = {
  // Question cache: 1 hour
  QUESTION: 3600,

  // Session cache: 24 hours
  SESSION: 86400,

  // Assembly cache: 2 hours
  ASSEMBLY: 7200,

  // Test cache: 1 hour
  TEST: 3600,

  // User cache: 30 minutes
  USER: 1800,

  // Template cache: 6 hours
  TEMPLATE: 21600,

  // Job results: 1 hour
  JOB_RESULT: 3600,

  // Job metadata: 30 minutes
  JOB_METADATA: 1800,

  // Rate limit: 1 minute
  RATE_LIMIT: 60,

  // Session tokens: 1 hour
  SESSION_TOKEN: 3600,

  // Refresh tokens: 7 days
  REFRESH_TOKEN: 604800,
};

/**
 * Queue Payload Contracts
 * Defines standard structure for queue messages
 */
export interface QueuePayloadContract {
  jobId: string;
  type: 'generation' | 'evaluation' | 'analytics';
  timestamp: number;
  userId?: string;
  correlationId?: string;
  retryCount?: number;
  payload: Record<string, any>;
}

/**
 * Redis Health Check Contract
 */
export interface RedisHealthCheck {
  status: 'healthy' | 'unhealthy';
  ping: boolean;
  timestamp: number;
  responseTime: number;
}
