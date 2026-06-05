import { z } from 'zod';
import { CreateTestRequestSchema, ApiSuccessResponseSchema } from '../schemas/api.schema';

export type CreateTestRequest = z.infer<typeof CreateTestRequestSchema>;
export type ApiSuccessResponse = z.infer<typeof ApiSuccessResponseSchema>;

export interface ApiErrorResponse {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: null;
}
