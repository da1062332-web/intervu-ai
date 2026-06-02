import { z } from 'zod';

export const QueueJobRequestSchema = z.object({
  jobId: z.string().min(1),
  testId: z.string().min(1),
  type: z.string().min(1),
});

export const QueueJobResponseSchema = z.object({
  status: z.enum(['completed', 'failed', 'processing']),
});
