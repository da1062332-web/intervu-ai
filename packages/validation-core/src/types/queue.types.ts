import { z } from 'zod';
import { QueueJobRequestSchema, QueueJobResponseSchema } from '../schemas/queue.schema';

export type QueueJobRequest = z.infer<typeof QueueJobRequestSchema>;
export type QueueJobResponse = z.infer<typeof QueueJobResponseSchema>;
