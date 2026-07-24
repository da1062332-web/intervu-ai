import test from 'node:test';
import assert from 'node:assert/strict';
import { buildConstraintRule, parseConstraintRule } from './constraint-utils';

test('parses complex formula constraints into a visible fallback shape', () => {
  const parsed = parseConstraintRule({ rule: 'other_number % 1 = 0' });

  assert.equal(parsed.target, 'Custom');
  assert.equal(parsed.operator, 'Formula');
  assert.equal(parsed.value, 'other_number % 1 = 0');
  assert.equal(parsed.rule, 'other_number % 1 = 0');
});

test('builds raw rule strings for custom operators', () => {
  const rule = buildConstraintRule({ target: 'other_number', operator: 'Formula', value: 'other_number % 1 = 0' });

  assert.equal(rule, 'other_number % 1 = 0');
});
