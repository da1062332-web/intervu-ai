import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { QueuePayloadSchema, QueuePayload, WorkerResponseSchema } from '@intervu-ai/contracts';
import { randomUUID } from 'crypto';

describe('Chaos & Pipeline Integration Tests', () => {
  let connection: IORedis;
  let pipelineQueue: Queue;
  let pipelineWorker: Worker;

  beforeAll(async () => {
    connection = new IORedis({ host: 'localhost', port: 6379, maxRetriesPerRequest: null });
    pipelineQueue = new Queue('chaos-test-queue', { connection: connection as never });
  });

  afterAll(async () => {
    if (pipelineWorker) await pipelineWorker.close();
    if (pipelineQueue) await pipelineQueue.close();
    if (connection) connection.disconnect();
  });

  it('Scenario A: Mixed Workload (100 valid, 20 invalid, 10 AI failures, 5 queue failures)', async () => {
    let completedCount = 0;
    let failedCount = 0;

    pipelineWorker = new Worker(
      'chaos-test-queue',
      async (job: Job<QueuePayload>) => {
        // Queue Failure Simulation
        if (job.data.payload.type === 'generation' && job.data.payload.testId === 'queue_fail') {
          throw new Error('Simulated Queue Error');
        }

        // Schema Validation (catches the 20 invalid)
        const payload = QueuePayloadSchema.parse(job.data);
        
        // AI Failure Simulation
        if (payload.payload.type === 'generation' && payload.payload.testId === 'ai_fail') {
          throw new Error('Simulated AI Error');
        }

        return { success: true, jobId: job.id, durationMs: 10 };
      },
      { connection: connection as never, concurrency: 20 }
    );

    pipelineWorker.on('completed', () => completedCount++);
    pipelineWorker.on('failed', () => failedCount++);

    const jobs: Array<{ name: string; data: unknown; opts?: Record<string, unknown> }> = [];
    
    // 100 Valid
    for (let i = 0; i < 100; i++) {
      jobs.push({
        name: 'job',
        data: { requestId: randomUUID(), correlationId: randomUUID(), type: 'generation', timestamp: new Date().toISOString(), payload: { type: 'generation', testId: `valid_${i}`, data: { topic: 'React', count: 1, difficulty: 'beginner' } } }
      });
    }

    // 20 Invalid (missing fields)
    for (let i = 0; i < 20; i++) {
      jobs.push({ name: 'job', data: { type: 'generation', timestamp: new Date().toISOString(), payload: {} } });
    }

    // 10 AI Failures
    for (let i = 0; i < 10; i++) {
      jobs.push({
        name: 'job',
        data: { requestId: randomUUID(), correlationId: randomUUID(), type: 'generation', timestamp: new Date().toISOString(), payload: { type: 'generation', testId: 'ai_fail', data: { topic: 'React', count: 1, difficulty: 'beginner' } } }
      });
    }

    // 5 Queue Failures
    for (let i = 0; i < 5; i++) {
      jobs.push({
        name: 'job',
        opts: { attempts: 1 },
        data: { requestId: randomUUID(), correlationId: randomUUID(), type: 'generation', timestamp: new Date().toISOString(), payload: { type: 'generation', testId: 'queue_fail', data: { topic: 'React', count: 1, difficulty: 'beginner' } } }
      });
    }

    await pipelineQueue.addBulk(jobs);
    await new Promise(resolve => setTimeout(resolve, 3000));

    expect(completedCount).toBe(100);
    expect(failedCount).toBeGreaterThanOrEqual(35); // 20 invalid + 10 ai fails + 5 queue fails

    await pipelineWorker.close();
  }, 10000);

  it('Scenario B: Worker Restart (Stalled Job Recovery)', async () => {
    let jobStarted = false;
    
    let crashWorker = new Worker(
      'chaos-test-queue',
      async () => {
        jobStarted = true;
        await new Promise(r => setTimeout(r, 5000)); // Simulate long work
        return { success: true };
      },
      { connection: connection as never }
    );

    await pipelineQueue.add('restart-job', { 
      requestId: randomUUID(), correlationId: randomUUID(), type: 'generation', timestamp: new Date().toISOString(), 
      payload: { type: 'generation', testId: 'restart', data: { topic: 'React', count: 1, difficulty: 'beginner' } } 
    });

    await new Promise(r => setTimeout(r, 50));
    expect(jobStarted).toBe(true);

    // Hard kill worker
    await crashWorker.close(true);

    let completed = false;
    let recoveryWorker = new Worker(
      'chaos-test-queue',
      async () => {
        completed = true;
        return { success: true };
      },
      { connection: connection as never, lockDuration: 1000, stalledInterval: 1000 } // fast stall check for tests
    );

    await new Promise(r => setTimeout(r, 3000)); // wait for stall interval
    expect(completed).toBe(true);

    await recoveryWorker.close();
  }, 15000);

  it('Scenario C: Redis Disconnect Resiliency', async () => {
    let completed = false;
    
    const resilientWorker = new Worker(
      'chaos-test-queue',
      async () => {
        completed = true;
        return { success: true };
      },
      { connection: connection as never }
    );

    // Disconnect redis momentarily
    connection.disconnect();
    
    // Add job while disconnected (ioredis buffers commands)
    const addPromise = pipelineQueue.add('disconnect-job', { 
      requestId: randomUUID(), correlationId: randomUUID(), type: 'generation', timestamp: new Date().toISOString(), 
      payload: { type: 'generation', testId: 'disconnect', data: { topic: 'React', count: 1, difficulty: 'beginner' } } 
    });

    // Reconnect
    await connection.connect();
    await addPromise;

    await new Promise(r => setTimeout(r, 500));
    expect(completed).toBe(true);

    await resilientWorker.close();
  });

  it('Scenario D: Invalid AI Schema', async () => {
    let failedReason = '';

    const strictWorker = new Worker(
      'chaos-test-queue',
      async () => {
        // Simulate returning bad schema
        const badResponse = { success: true, result: {} };
        return WorkerResponseSchema.parse(badResponse); // Throws
      },
      { connection: connection as never }
    );

    strictWorker.on('failed', (job, err) => {
      failedReason = err.message;
    });

    await pipelineQueue.add('bad-schema-job', { 
      requestId: randomUUID(), correlationId: randomUUID(), type: 'generation', timestamp: new Date().toISOString(), 
      payload: { type: 'generation', testId: 'schema', data: { topic: 'React', count: 1, difficulty: 'beginner' } } 
    });

    await new Promise(r => setTimeout(r, 500));
    expect(failedReason).toContain('invalid_type');

    await strictWorker.close();
  });
});
