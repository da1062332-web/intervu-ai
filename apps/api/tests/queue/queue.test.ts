import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

describe('Queue Integration Tests', () => {
  let connection: IORedis;
  let testQueue: Queue;
  let testWorker: Worker;

  beforeAll(async () => {
    // Attempt connecting to local redis if available, otherwise tests might fail/timeout.
    // In CI this should be provided via services. We use maxRetriesPerRequest: null for BullMQ compatibility
    connection = new IORedis({ host: 'localhost', port: 6379, maxRetriesPerRequest: null });
    testQueue = new Queue('evaluation-test-queue', { connection });
  });

  afterAll(async () => {
    if (testWorker) await testWorker.close();
    if (testQueue) await testQueue.close();
    if (connection) connection.disconnect();
  });

  it('worker processes evaluation-job successfully', async () => {
    let processed = false;
    testWorker = new Worker(
      'evaluation-test-queue',
      async (job: Job) => {
        if (job.name === 'evaluation-job') processed = true;
        return { success: true };
      },
      { connection }
    );

    await testQueue.add('evaluation-job', { data: 'test' });
    
    // wait for worker to process
    await new Promise(resolve => setTimeout(resolve, 500));
    expect(processed).toBe(true);
  });

  it('handles retry behavior and failure handling', async () => {
    let attempts = 0;
    const failWorker = new Worker(
      'evaluation-test-queue',
      async () => {
        attempts++;
        throw new Error('Forced failure');
      },
      { connection }
    );

    const job = await testQueue.add('pregeneration-job', { foo: 'bar' }, { attempts: 3, backoff: { type: 'fixed', delay: 100 } });
    
    // wait for all retries to exhaust
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const state = await job.getState();
    expect(attempts).toBeGreaterThanOrEqual(1);
    expect(state).toBe('failed'); // Equivalent to dead-letter behavior for BullMQ (failed status)
    
    await failWorker.close();
  });
});
