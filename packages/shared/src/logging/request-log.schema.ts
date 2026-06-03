import { z } from 'zod';

export const RequestLogSchema = z.object({
  method: z.string(),
  path: z.string(),
  durationMs: z.number(),
  statusCode: z.number(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
});
