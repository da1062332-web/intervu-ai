import { PRNG } from "./prng";
import { Variable } from "../types/template.types";

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

  for (const variable of variables) {
    if (variable.type === "number") {
      const { min, max, step } = variable.range;
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
      const options = variable.options;
      if (options.length === 0) {
        throw new Error(
          `Variable ${variable.name} of type string has no options`,
        );
      }
      const randomIdx = prng.nextInt(0, options.length - 1);
      context[variable.name] = options[randomIdx];
    }
  }

  return context;
}
