import { PRNG } from "./utils/random-seed.util";
import { generateVariables } from "@intervu-ai/generation";
import { evaluateConstraints } from "@intervu-ai/generation";
import { Variable, Constraint } from "@intervu-ai/generation";

export class ParameterGeneratorService {
  /**
   * Generates deterministic parameters for a template given a seed.
   * Retries up to maxAttempts if constraints are violated.
   */
  generateParameters(
    variableSchema: Record<string, unknown>,
    constraintsSchema: Record<string, unknown>,
    prng: PRNG,
    maxAttempts: number = 100,
  ): Record<string, unknown> {
    const variables = (variableSchema.variables || []) as Variable[];
    const constraints = (constraintsSchema.constraints || []) as Constraint[];

    let attempts = 0;
    while (attempts < maxAttempts) {
      attempts++;
      const parameters = generateVariables(variables, prng);

      // Validate constraints
      const constraintCheck = evaluateConstraints(constraints, parameters);
      if (constraintCheck.isValid) {
        return parameters;
      }
    }

    throw new Error(
      `Failed to generate valid parameters satisfying constraints after ${maxAttempts} attempts.`,
    );
  }
}
