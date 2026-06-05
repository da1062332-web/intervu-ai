import { z } from 'zod';

export const HealthResponseSchema = z.object({
  status: z.string(),
  service: z.string(),
  timestamp: z.string(),
  version: z.string(),
  uptime: z.number(),
  dependencies: z.record(z.string(), z.string()).optional()
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
