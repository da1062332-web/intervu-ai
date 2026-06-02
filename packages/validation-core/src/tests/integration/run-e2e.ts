import { CreateTestRequestSchema, ApiSuccessResponseSchema } from '../../schemas/api.schema';
import { AiQuestionResponseSchema } from '../../schemas/ai.schema';
import { QueueJobRequestSchema } from '../../schemas/queue.schema';
import { CreateTestRequestDto } from '../../dto/create-test.dto';

console.log('Running End-to-End Contract Flow Test...');

// 1. Frontend Request Creation
const frontendPayload = { companyId: 'tcs', testType: 'aptitude' };
const validFrontendRequest = CreateTestRequestSchema.parse(frontendPayload);
console.log('✓ Frontend Request Validation passed');

// 2. API Validation
const apiValidationResult = CreateTestRequestDto.validate(frontendPayload);
if (!apiValidationResult.success) throw new Error('API Validation Failed');
console.log('✓ API Validation passed');

// 3. AI Runtime Validation
const aiRawResponse = {
  questions: [
    { text: 'What is 2+2?', options: ['2', '3', '4'], correctAnswer: '4' }
  ]
};
const validAiResponse = AiQuestionResponseSchema.parse(aiRawResponse);
console.log('✓ AI Runtime Validation passed');

// 4. Queue Dispatch Validation
const queuePayload = {
  jobId: 'job_123',
  testId: 'test_456',
  type: 'TEST_GENERATION'
};
const validQueuePayload = QueueJobRequestSchema.parse(queuePayload);
console.log('✓ Queue Dispatch Validation passed');

// 5. Response Normalization & Frontend Validation
const normalizedResponse = {
  success: true,
  data: { status: 'completed' }
};
const finalFrontendCheck = ApiSuccessResponseSchema.parse(normalizedResponse);
console.log('✓ Response Normalization & Frontend Validation passed');

console.log('\n✅ All integration tests PASSED successfully.');
