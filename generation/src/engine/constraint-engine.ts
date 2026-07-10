import { evaluateExpression } from "./math-parser";
import { Constraint } from "../types/template.types";

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
  context: Record<string, unknown>,
): ConstraintEvaluationResult {
  const violatedConstraints: Constraint[] = [];

  for (const constraint of constraints) {
    try {
      let isSatisfied = false;
      const ruleText = constraint.rule.trim();

      // Check if it's a Range rule: "varName Range min-max"
      const rangeMatch = ruleText.match(
        /^(\w+)\s+Range\s+([-\d.]+)-([-\d.]+)$/i,
      );
      if (rangeMatch) {
        const [_, varName, minStr, maxStr] = rangeMatch;
        const val = context[varName];
        if (val !== undefined && val !== null) {
          const numVal = Number(val);
          isSatisfied = numVal >= Number(minStr) && numVal <= Number(maxStr);
        }
      } else {
        const evalResult = evaluateExpression(ruleText, context);
        isSatisfied = evalResult === true;
      }

      if (!isSatisfied) {
        violatedConstraints.push(constraint);
      }
    } catch {
      // If evaluation throws (e.g. division by zero), treat as a critical failure
      violatedConstraints.push({
        rule: constraint.rule,
        severity: "critical",
      });
    }
  }

  // Parameter set is invalid if there are any critical violations
  const isValid = !violatedConstraints.some((c) => c.severity === "critical");

  return {
    isValid,
    violatedConstraints,
  };
}
