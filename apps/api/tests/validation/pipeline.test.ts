import { describe, it, expect } from 'vitest';
import { ZodValidationPipe, CreateUserSchema } from '@intervu/shared';
import { BadRequestException } from '@nestjs/common';

describe('Validation Pipeline Tests', () => {
  const pipe = new ZodValidationPipe(CreateUserSchema);

  it('Valid payload passes', () => {
    const payload = { email: 'test@example.com', password: 'password123' };
    expect(pipe.transform(payload, { type: 'body' } as unknown)).toEqual(payload);
  });

  it('Missing fields fails', () => {
    const payload = { email: 'test@example.com' };
    try {
      pipe.transform(payload, { type: 'body' } as unknown);
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const res = (error as BadRequestException).getResponse() as unknown;
      expect((res as unknown as { success: boolean }).success).toBe(false);
      expect((res as unknown as { error: { code: string } }).error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('Wrong types fails', () => {
    const payload = { email: 'test@example.com', password: 123 };
    expect(() => pipe.transform(payload, { type: 'body' } as unknown)).toThrow(BadRequestException);
  });

  it('Malformed requests blocked', () => {
    const payload = { foo: 'bar' };
    expect(() => pipe.transform(payload, { type: 'body' } as unknown)).toThrow(BadRequestException);
  });
});
