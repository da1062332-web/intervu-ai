import { PRNG } from "./prng";
import { Variable } from "../types/template.types";
import { evaluateExpression } from "./math-parser";

/**
 * Rounds a number to the precision of the step to prevent floating point inaccuracies.
 */
export function roundToPrecision(val: number, step?: number): number {
  if (step === undefined) return val;
  const stepStr = step.toString();
  const decimalIdx = stepStr.indexOf(".");
  if (decimalIdx === -1) return Math.round(val);
  const precision = stepStr.length - decimalIdx - 1;
  return parseFloat(val.toFixed(precision));
}

/**
 * Deterministically generates values for all variables defined in the template.
 */
export function generateVariables(
  variables: Variable[],
  prng: PRNG,
): Record<string, unknown> {
  const context: Record<string, unknown> = {};

  // 1. Generate base (non-formula) variables
  for (const variable of variables) {
    if (variable.type === "number") {
      const range = (variable as any).range || {};
      const min =
        range.min !== undefined
          ? range.min
          : (variable as any).min !== undefined
            ? (variable as any).min
            : 0;
      const max =
        range.max !== undefined
          ? range.max
          : (variable as any).max !== undefined
            ? (variable as any).max
            : 10;
      const step =
        range.step !== undefined ? range.step : (variable as any).step;

      if (step !== undefined && step > 0) {
        const stepsCount = Math.floor((max - min) / step);
        const randomStepIdx = prng.nextInt(0, stepsCount);
        const rawValue = min + randomStepIdx * step;
        context[variable.name] = roundToPrecision(rawValue, step);
      } else {
        // Continuous range generator
        const rawValue = min + prng.next() * (max - min);
        context[variable.name] = rawValue;
      }
    } else if (variable.type === "string") {
      const options = (variable as any).options;
      if (!options || !Array.isArray(options) || options.length === 0) {
        throw new Error(
          `Variable ${variable.name} of type string has no valid options array`,
        );
      }
      const randomIdx = prng.nextInt(0, options.length - 1);
      context[variable.name] = options[randomIdx];
    } else if (variable.type === "integer") {
      const min =
        (variable as any).min !== undefined ? (variable as any).min : 0;
      const max =
        (variable as any).max !== undefined ? (variable as any).max : 100;
      const step = (variable as any).step;
      if (step !== undefined && step > 0) {
        const stepsCount = Math.floor((max - min) / step);
        const randomStepIdx = prng.nextInt(0, stepsCount);
        context[variable.name] = Math.round(min + randomStepIdx * step);
      } else {
        context[variable.name] = prng.nextInt(min, max);
      }
    } else if (variable.type === "decimal") {
      const min =
        (variable as any).min !== undefined ? (variable as any).min : 0.0;
      const max =
        (variable as any).max !== undefined ? (variable as any).max : 1.0;
      const step = (variable as any).step;
      const precision =
        (variable as any).precision !== undefined
          ? (variable as any).precision
          : 2;
      let rawValue: number;
      if (step !== undefined && step > 0) {
        const stepsCount = Math.floor((max - min) / step);
        const randomStepIdx = prng.nextInt(0, stepsCount);
        rawValue = min + randomStepIdx * step;
      } else {
        rawValue = min + prng.next() * (max - min);
      }
      context[variable.name] = parseFloat(rawValue.toFixed(precision));
    } else if (variable.type === "static") {
      context[variable.name] =
        (variable as any).value !== undefined
          ? (variable as any).value
          : (variable as any).defaultValue;
    } else if (variable.type === "boolean") {
      context[variable.name] = prng.next() < 0.5;
    }
  }

  // 2. Iteratively resolve formula/derived variables (topological dependency resolution)
  const formulaVars = variables.filter((v) => v.type === "formula");
  let unresolved = [...formulaVars];
  let lastUnresolvedCount = unresolved.length + 1;

  while (unresolved.length > 0 && unresolved.length < lastUnresolvedCount) {
    lastUnresolvedCount = unresolved.length;
    const nextUnresolved: typeof unresolved = [];

    for (const v of unresolved) {
      const formulaStr = (v as any).formula;
      try {
        const evaluated = evaluateExpression(formulaStr, context);
        if (evaluated === undefined || evaluated === null) {
          throw new Error("Formula evaluated to null or undefined");
        }
        context[v.name] = evaluated;
      } catch (err) {
        // Retry in the next iteration if it depends on another unresolved formula variable
        nextUnresolved.push(v);
      }
    }
    unresolved = nextUnresolved;
  }

  if (unresolved.length > 0) {
    throw new Error(
      `Circular or unresolved dependencies in formula variables: ${unresolved.map((v) => v.name).join(", ")}`,
    );
  }

  return context;
}
