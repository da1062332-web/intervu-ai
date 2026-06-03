import { z } from 'zod';
import { CreateTestRequestSchema, ApiSuccessResponseSchema } from '../schemas/api.schema';

export type CreateTestRequest = z.infer<typeof CreateTestRequestSchema>;
export type ApiSuccessResponse = z.infer<typeof ApiSuccessResponseSchema>;
