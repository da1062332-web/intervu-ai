import { z } from 'zod';

export const CreateTestRequestSchema = z.object({
  companyId: z.string().min(1),
  testType: z.string().min(1),
});

export const ApiSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.any().optional(),
  meta: z.any().optional(),
});
