import { describe, it, expect } from 'vitest';
import { UserResponseSchema } from '@intervu/shared';

describe('User Contract', () => {
  it('DTO ↔ Schema consistency', () => {
    const payload = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      createdAt: new Date(),
    };
    
    const result = UserResponseSchema.parse(payload);
    expect(result).toBeDefined();
    expect(result.id).toBe(payload.id);
  });
});
