import { describe, it, expect } from 'vitest';
import { buildConstraintRule, parseConstraintRule } from './constraint-utils';

describe('constraint-utils', () => {
  it('parses complex formula constraints into a visible fallback shape', () => {
    const parsed = parseConstraintRule({ rule: 'other_number % 1 = 0' });

    expect(parsed.target).toBe('Custom');
    expect(parsed.operator).toBe('Formula');
    expect(parsed.value).toBe('other_number % 1 = 0');
    expect(parsed.rule).toBe('other_number % 1 = 0');
  });

  it('builds raw rule strings for custom operators', () => {
    const rule = buildConstraintRule({ target: 'other_number', operator: 'Formula', value: 'other_number % 1 = 0' });

    expect(rule).toBe('other_number % 1 = 0');
  });
});
