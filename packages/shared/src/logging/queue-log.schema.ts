import { z } from "zod";

export const QueueLogSchema = z.object({
  queueName: z.string(),
  jobId: z.string(),
  attempt: z.number(),
  processingTimeMs: z.number(),
  status: z.enum(["completed", "failed", "stalled"]),
  error: z.string().optional(),
});
