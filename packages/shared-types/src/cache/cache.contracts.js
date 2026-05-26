"use strict";
/**
 * Cache Key Contracts for Redis
 * Defines standard key formats for caching different data types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CACHE_TTL = exports.CACHE_KEY_PATTERNS = void 0;
exports.CACHE_KEY_PATTERNS = {
    // Question cache: question:{id}
    QUESTION: (id) => `question:${id}`,
    // Session cache: session:{id}
    SESSION: (id) => `session:${id}`,
    // Assembly cache: assembly:{id}
    ASSEMBLY: (id) => `assembly:${id}`,
    // Test cache: test:{id}
    TEST: (id) => `test:${id}`,
    // User cache: user:{id}
    USER: (id) => `user:${id}`,
    // Template cache: template:{id}
    TEMPLATE: (id) => `template:${id}`,
    // Job results: job:result:{jobId}
    JOB_RESULT: (jobId) => `job:result:${jobId}`,
    // Job metadata: job:meta:{jobId}
    JOB_METADATA: (jobId) => `job:meta:${jobId}`,
    // Rate limit cache: ratelimit:{userId}:{endpoint}
    RATE_LIMIT: (userId, endpoint) => `ratelimit:${userId}:${endpoint}`,
    // Session tokens: token:{token}
    SESSION_TOKEN: (token) => `token:${token}`,
    // Refresh tokens: refresh:{userId}
    REFRESH_TOKEN: (userId) => `refresh:${userId}`,
};
/**
 * Default TTL (Time-to-Live) values in seconds
 */
exports.CACHE_TTL = {
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
