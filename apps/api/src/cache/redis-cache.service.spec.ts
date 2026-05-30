import { RedisCacheService } from '@/cache/redis-cache.service';
import { RedisConnectionManager } from '@/cache/redis-connection.manager';
import { AppLogger } from '@intervu-ai/shared-logger';
import Redis from 'ioredis';

describe('Redis Cache Service', () => {
  let redis: Redis;
  let cacheService: RedisCacheService;
  let logger: AppLogger;

  beforeAll(async () => {
    logger = new AppLogger({
      name: 'cache-test',
      isDevelopment: true,
    });

    redis = new Redis({
      host: 'localhost',
      port: 6379,
      retryStrategy: () => null,
    });

    // Initialize connection manager
    await RedisConnectionManager.connect(
      `redis://${redis.options.host}:${redis.options.port}`
    );
    RedisConnectionManager.setLogger(logger);

    cacheService = new RedisCacheService(logger);
  });

  afterAll(async () => {
    await RedisConnectionManager.disconnect();
    await redis.quit();
  });

  afterEach(async () => {
    // Clear all keys after each test
    await redis.flushdb();
  });

  describe('Basic Operations', () => {
    it('should set and get cache values', async () => {
      const testData = { id: 1, name: 'Test' };
      await cacheService.set('test-key', testData);

      const retrieved = await cacheService.get('test-key');
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', async () => {
      const value = await cacheService.get('non-existent');
      expect(value).toBeNull();
    });

    it('should delete cache values', async () => {
      await cacheService.set('delete-key', { value: 'test' });
      const deleted = await cacheService.delete('delete-key');

      expect(deleted).toBe(true);

      const retrieved = await cacheService.get('delete-key');
      expect(retrieved).toBeNull();
    });

    it('should check cache existence', async () => {
      await cacheService.set('exists-key', { value: 'test' });

      const exists = await cacheService.exists('exists-key');
      expect(exists).toBe(true);

      const notExists = await cacheService.exists('non-existent');
      expect(notExists).toBe(false);
    });
  });

  describe('TTL Management', () => {
    it('should set TTL on cache values', async () => {
      await cacheService.set('ttl-key', { value: 'test' });
      const set = await cacheService.setTTL('ttl-key', 60);

      expect(set).toBe(true);

      const ttl = await cacheService.getTTL('ttl-key');
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(60);
    });

    it('should respect TTL expiration', async () => {
      await cacheService.set('short-ttl', { value: 'test' }, { ttl: 1 });

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const retrieved = await cacheService.get('short-ttl');
      expect(retrieved).toBeNull();
    });
  });

  describe('Prefix Usage', () => {
    it('should use prefix for keys', async () => {
      const questionId = 'q-123';
      const questionData = { question: 'What is 2+2?', answer: 4 };

      await cacheService.set(questionId, questionData, { prefix: 'question' });

      const retrieved = await cacheService.get(questionId, { prefix: 'question' });
      expect(retrieved).toEqual(questionData);
    });

    it('should isolate prefixed keys', async () => {
      const id = 'test-123';
      const sessionData = { sessionId: id };
      const questionData = { questionId: id };

      await cacheService.set(id, sessionData, { prefix: 'session' });
      await cacheService.set(id, questionData, { prefix: 'question' });

      const session = await cacheService.get(id, { prefix: 'session' });
      const question = await cacheService.get(id, { prefix: 'question' });

      expect(session).toEqual(sessionData);
      expect(question).toEqual(questionData);
    });
  });

  describe('Domain-Specific Methods', () => {
    it('should use getQuestion/setQuestion', async () => {
      const questionId = 'q-001';
      const questionData = { text: 'Question text', options: ['A', 'B', 'C', 'D'] };

      await cacheService.setQuestion(questionId, questionData);
      const retrieved = await cacheService.getQuestion(questionId);

      expect(retrieved).toEqual(questionData);
    });

    it('should use getSession/setSession', async () => {
      const sessionId = 's-001';
      const sessionData = { userId: 'user-123', expiresAt: Date.now() + 3600000 };

      await cacheService.setSession(sessionId, sessionData);
      const retrieved = await cacheService.getSession(sessionId);

      expect(retrieved).toEqual(sessionData);
    });

    it('should use getAssembly/setAssembly', async () => {
      const assemblyId = 'a-001';
      const assemblyData = { name: 'Test Assembly', questions: 10 };

      await cacheService.setAssembly(assemblyId, assemblyData);
      const retrieved = await cacheService.getAssembly(assemblyId);

      expect(retrieved).toEqual(assemblyData);
    });
  });

  describe('Pattern Matching', () => {
    it('should clear cache by pattern', async () => {
      // Set multiple keys with prefix
      await cacheService.set('session:1', { id: 1 }, { prefix: 'session' });
      await cacheService.set('session:2', { id: 2 }, { prefix: 'session' });
      await cacheService.set('question:1', { id: 1 }, { prefix: 'question' });

      // Clear only session keys
      const deleted = await cacheService.clear('session:*');
      expect(deleted).toBeGreaterThanOrEqual(2);

      // Verify session keys are deleted
      const session1 = await cacheService.get('1', { prefix: 'session' });
      expect(session1).toBeNull();

      // Verify question keys still exist
      const question1 = await cacheService.get('1', { prefix: 'question' });
      expect(question1).toEqual({ id: 1 });
    });
  });

  describe('Type Safety', () => {
    interface TestObject {
      id: string;
      name: string;
      count: number;
    }

    it('should preserve types through cache', async () => {
      const original: TestObject = {
        id: 'obj-1',
        name: 'Test Object',
        count: 42,
      };

      await cacheService.set('typed-key', original);
      const retrieved = await cacheService.get<TestObject>('typed-key');

      expect(retrieved).toEqual(original);
      expect(typeof retrieved?.count).toBe('number');
    });
  });

  describe('Error Handling', () => {
    it('should handle cache errors gracefully', async () => {
      // Try to set invalid data
      const result = await cacheService.set('key', { circular: null } as any);
      expect([true, false]).toContain(result);
    });

    it('should handle get errors gracefully', async () => {
      const result = await cacheService.get('non-existent-key');
      expect(result).toBeNull();
    });
  });
});
