import { ZodSchema } from 'zod';
import { ContractViolationError } from '../errors/index';
import { formatZodError } from '../utils/validation.utils';

export function validateResponse<T>(schema: ZodSchema<T>, payload: unknown): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new ContractViolationError(
      'Response payload violates contract schema',
      formatZodError(result.error)
    );
  }
  return result.data;
}
