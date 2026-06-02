import { CreateTestRequestSchema } from '../../schemas/api.schema';
import { formatZodError } from '../../utils/validation.utils';

console.log('Simulating Invalid Payload Failure...');

const invalidPayload = {
  difficulty: 'super-hard', // Invalid, must be from Difficulty enum
  companyId: 123, // Invalid, must be string
  // Missing required fields like testType
};

const result = CreateTestRequestSchema.safeParse(invalidPayload);

if (!result.success) {
  console.log('Request Rejected: YES');
  console.log('Validation Error Returned: YES');
  
  const formattedErrors = formatZodError(result.error);
  
  const errorContract = {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request payload',
      details: formattedErrors
    }
  };
  
  console.log('\nContract Output:');
  console.log(JSON.stringify(errorContract, null, 2));
} else {
  console.log('Request unexpectedly passed.');
}
