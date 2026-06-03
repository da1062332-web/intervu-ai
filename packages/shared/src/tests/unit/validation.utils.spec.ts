import { z } from 'zod';
import { formatZodError } from '../../utils/validation.utils';

describe('Validation Utils', () => {
  it('should format zod errors correctly', () => {
    const schema = z.object({ name: z.string().min(3) });
    const result = schema.safeParse({ name: 'ab' });
    
    if (!result.success) {
      const issues = formatZodError(result.error);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0]).toContain('name');
    } else {
      fail('Should have failed validation');
    }
  });
});
