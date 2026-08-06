import { describe, it, expect } from 'vitest';
import { buildPreviewErrorDisplay } from '../preview-error-utils';

describe('buildPreviewErrorDisplay', () => {
  it('renders a detailed formula error', () => {
    const display = buildPreviewErrorDisplay({
      message: 'Template configuration error.',
      category: 'FORMULA_ERROR',
      reason: "Unknown variable 'clild_age' in formula 'parent_age = clild_age + parent_age_difference'",
      details: {
        category: 'FORMULA_ERROR',
        reason: "Unknown variable 'clild_age' in formula 'parent_age = clild_age + parent_age_difference'",
        context: {
          unknownSymbol: 'clild_age',
          formula: 'parent_age = clild_age + parent_age_difference',
        },
      },
    } as any);

    expect(display.title).toBe('Formula error');
    expect(display.details).toContain('Unknown variable: clild_age');
    expect(display.details).toContain('Formula: parent_age = clild_age + parent_age_difference');
  });

  it('renders a detailed placeholder error', () => {
    const display = buildPreviewErrorDisplay({
      message: 'Template configuration error.',
      category: 'PLACEHOLDER_ERROR',
      reason: 'Unresolved placeholder(s) in question template',
      details: {
        category: 'PLACEHOLDER_ERROR',
        reason: 'Unresolved placeholder(s) in question template',
        context: {
          placeholders: ['missing_var'],
        },
      },
    } as any);

    expect(display.title).toBe('Placeholder error');
    expect(display.details).toContain('Missing placeholder: missing_var');
  });

  it('falls back safely for unknown categories', () => {
    const display = buildPreviewErrorDisplay({
      message: 'Template configuration error.',
      category: 'SOMETHING_ELSE',
    } as any);

    expect(display.title).toBe('Template configuration error');
    expect(display.details).toEqual([]);
  });
});
