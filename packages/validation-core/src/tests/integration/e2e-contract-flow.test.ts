import { z } from 'zod';
import { CreateTestRequestSchema, ApiSuccessResponseSchema } from '../../schemas/api.schema';
import { AiQuestionResponseSchema } from '../../schemas/ai.schema';
import { QueueJobRequestSchema } from '../../schemas/queue.schema';
import { CreateTestRequestDto } from '../../dto/create-test.dto';
import { Difficulty } from '../../enums/difficulty.enum';

describe('End-to-End Contract Flow', () => {
  it('should validate payloads across the entire system lifecycle', () => {
    // 1. Frontend Request Creation
    const frontendPayload = { companyId: 'tcs', testType: 'aptitude' };
    const validFrontendRequest = CreateTestRequestSchema.parse(frontendPayload);
    expect(validFrontendRequest).toEqual(frontendPayload);

    // 2. API Validation (simulated via DTO validate)
    const apiValidationResult = CreateTestRequestDto.validate(frontendPayload);
    expect(apiValidationResult.success).toBe(true);

    // 3. AI Runtime Validation
    const aiRawResponse = {
      questions: [
        { text: 'What is 2+2?', options: ['2', '3', '4'], correctAnswer: '4' }
      ]
    };
    const validAiResponse = AiQuestionResponseSchema.parse(aiRawResponse);
    expect(validAiResponse.questions).toHaveLength(1);

    // 4. Queue Dispatch Validation
    const queuePayload = {
      jobId: 'job_123',
      testId: 'test_456',
      type: 'TEST_GENERATION'
    };
    const validQueuePayload = QueueJobRequestSchema.parse(queuePayload);
    expect(validQueuePayload.jobId).toBe('job_123');

    // 5. Response Normalization & Frontend Validation
    const normalizedResponse = {
      success: true as const,
      data: { status: 'completed' }
    };
    
    const finalFrontendCheck = ApiSuccessResponseSchema.parse(normalizedResponse);
    expect(finalFrontendCheck.success).toBe(true);
    expect(finalFrontendCheck.data).toBeDefined();
  });
});
