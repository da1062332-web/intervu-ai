import { describe, it, expect } from 'vitest';
import { UserResponseSchema } from '@intervu/shared';

describe('User Contract - Intentional Violation', () => {
  it('Should fail when payload has random data', () => {
    const payload = { random: true };
    
    // This will throw a ZodError during CI because the payload is invalid.
    expect(() => UserResponseSchema.parse(payload)).toThrow();
  });
});
