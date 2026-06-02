import { ZodSchema, z } from 'zod';
import { ValidationResult } from '../types/validation.types';
import { formatZodError } from './validation.utils';

export function validateContract<T extends ZodSchema>(schema: T, data: unknown): ValidationResult {
  const result = schema.safeParse(data);
  if (result.success) {
    return { valid: true, issues: [] };
  } else {
    return { valid: false, issues: formatZodError(result.error) };
  }
}
