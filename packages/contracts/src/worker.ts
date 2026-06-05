import { z } from "zod";

export const WorkerResponseSchema = z.object({
  success: z.boolean(),
  jobId: z.string(),
  result: z.unknown().optional(),
  error: z
    .object({
      message: z.string(),
      code: z.string().optional(),
      stack: z.string().optional(),
    })
    .optional(),
  durationMs: z.number().int().min(0),
});

export type WorkerResponse = z.infer<typeof WorkerResponseSchema>;
