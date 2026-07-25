export interface ParsedConstraintRule {
  id: string;
  target: string;
  operator: string;
  value: string;
  rule: string;
}

export function parseConstraintRule(item: any, index = 0): ParsedConstraintRule {
  if (typeof item === 'string') {
    return {
      id: `${item}-${index}`,
      target: 'Custom',
      operator: 'Formula',
      value: item,
      rule: item,
    };
  }

  const rawRule = typeof item?.rule === 'string' && item.rule.trim()
    ? item.rule.trim()
    : `${item?.target || ''} ${item?.operator || '=='} ${item?.value || ''}`.trim();

  const parsedRule = rawRule.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*(>=|<=|!=|==|=|>|<)\s*(.+)$/);
  const constraintId = item?.id || `${item?.target || item?.rule || 'constraint'}-${index}`;

  if (!parsedRule) {
    return {
      id: constraintId,
      target: 'Custom',
      operator: 'Formula',
      value: rawRule,
      rule: rawRule,
    };
  }

  return {
    id: constraintId,
    target: parsedRule[1] || item?.target || '',
    operator: parsedRule[2] || item?.operator || '==',
    value: parsedRule[3]?.trim() || item?.value || '',
    rule: rawRule,
  };
}

export function buildConstraintRule(input: { target: string; operator: string; value: string }) {
  const normalizedTarget = input.target?.trim() || '';
  const normalizedValue = input.value?.trim() || '';

  if (!normalizedValue) {
    return '';
  }

  if (input.operator === 'Formula' || input.operator === 'Custom' || input.operator === 'Regex') {
    return normalizedValue;
  }

  if (!normalizedTarget) {
    return '';
  }

  return `${normalizedTarget} ${input.operator} ${normalizedValue}`;
}

export function toConstraintPayload(item: any) {
  const rule = item?.rule || buildConstraintRule({
    target: item?.target || '',
    operator: item?.operator || '==',
    value: item?.value || '',
  });

  return {
    target: item?.target || '',
    operator: item?.operator || '==',
    value: item?.value || '',
    rule,
  };
}
