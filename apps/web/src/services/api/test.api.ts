import { apiClient } from './client';
import { 
  CreateTestRequestSchema, 
  CreateTestRequest,
  ApiSuccessResponseSchema,
  ApiSuccessResponse 
} from '@intervu-ai/contracts';

export const TestApi = {
  createTest: async (payload: CreateTestRequest): Promise<ApiSuccessResponse> => {
    // Validate request before sending
    const validRequest = CreateTestRequestSchema.parse(payload);
    
    const data = await apiClient.request<unknown>('/tests', {
      method: 'POST',
      body: validRequest,
    });
    
    // Validate response after receiving
    // apiClient already unwraps the data, so we reconstruct the envelope for validation
    return ApiSuccessResponseSchema.parse({ success: true, data });
  }
};
