import { CreateTestRequestSchema } from '@intervu/shared';

describe('API Contracts', () => {
  it('should validate valid create test payload', () => {
    const payload = { companyId: 'tcs', testType: 'aptitude' };
    const result = CreateTestRequestSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should reject invalid create test payload', () => {
    const payload = { companyId: '' }; // missing testType, empty companyId
    const result = CreateTestRequestSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});
