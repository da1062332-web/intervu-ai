import { describe, it, expect } from 'vitest';
import { normalizeApiError } from '../error';

describe('normalizeApiError', () => {
  it('extracts preview error category and reason from wrapped response data objects', () => {
    const error = {
      message: 'Preview generation failed',
      response: {
        data: {
          success: false,
          error: {
            code: 'PREVIEW_GENERATION_ERROR',
            message: 'Template configuration error.',
            details: {
              category: 'FORMULA_ERROR',
              reason: "Unknown variable 'clild_age'",
              context: {
                formula: 'parent_age = clild_age + parent_age_difference',
                unknownSymbol: 'clild_age',
              },
            },
          },
        },
      },
    };

    const normalized = normalizeApiError(error as any);

    expect(normalized.category).toBe('FORMULA_ERROR');
    expect(normalized.reason).toBe("Unknown variable 'clild_age'");
    expect((normalized.details as any)?.context?.formula).toBe('parent_age = clild_age + parent_age_difference');
  });
});
