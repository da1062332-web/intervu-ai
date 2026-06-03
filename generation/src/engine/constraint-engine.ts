import { evaluateExpression } from './math-parser';
import { Constraint } from '../types/template.types';

export interface ConstraintEvaluationResult {
  isValid: boolean;
  violatedConstraints: Constraint[];
}

/**
 * Evaluates all constraints in the template against the generated variables.
 * Critical violations fail the parameter set. Warning violations are tracked.
 */
export function evaluateConstraints(
  constraints: Constraint[],
  context: Record<string, unknown>
): ConstraintEvaluationResult {
  const violatedConstraints: Constraint[] = [];

  for (const constraint of constraints) {
    try {
      const isSatisfied = evaluateExpression(constraint.rule, context);
      if (isSatisfied !== true) {
        violatedConstraints.push(constraint);
      }
    } catch {
      // If evaluation throws (e.g. division by zero), treat as a critical failure
      violatedConstraints.push({
        rule: constraint.rule,
        severity: 'critical',
      });
    }
  }

  // Parameter set is invalid if there are any critical violations
  const isValid = !violatedConstraints.some((c) => c.severity === 'critical');

  return {
    isValid,
    violatedConstraints,
  };
}
