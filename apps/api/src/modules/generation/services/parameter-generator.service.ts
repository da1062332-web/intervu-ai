import { Injectable, BadRequestException } from "@nestjs/common";
import * as math from "mathjs";

interface VariableDefinition {
  name: string;
  type: "number" | "string" | "boolean" | "decimal" | string;
  min?: number;
  max?: number;
  options?: any[];
  generator?: "even" | "odd" | "prime" | string;
  precision?: number;
}

interface TemplateMetadata {
  variableSchema?: {
    variables?: VariableDefinition[];
    derivedVariables?: string[];
    formulas?: string[];
    [key: string]: any;
  };
  constraints?: {
    rules?: string[];
    excludeDuplicates?: boolean;
    customConstraints?: any;
    [key: string]: any;
  };
  formulas?: string[];
  [key: string]: any;
}

function isPrime(num: number): boolean {
  if (num <= 1) return false;
  if (num <= 3) return true;
  if (num % 2 === 0 || num % 3 === 0) return false;
  for (let i = 5; i * i <= num; i += 6) {
    if (num % i === 0 || num % (i + 2) === 0) return false;
  }
  return true;
}

function getPrimeInRange(min: number, max: number): number {
  const primes: number[] = [];
  for (let i = min; i <= max; i++) {
    if (isPrime(i)) primes.push(i);
  }
  if (primes.length === 0) {
    // If no primes, return closest prime or fallback
    return 2;
  }
  return primes[Math.floor(Math.random() * primes.length)];
}

@Injectable()
export class ParameterGeneratorService {
  /**
   * Generates parameters according to variable schemas, formulas, and constraints.
   */
  generateParameters(metadata: TemplateMetadata): Record<string, any> {
    const variableSchema = metadata.variableSchema || {};
    const constraints = metadata.constraints || {};
    const variables = variableSchema.variables || [];
    const formulas = metadata.formulas || variableSchema.formulas || [];

    const MAX_INTERNAL_ATTEMPTS = 50;
    let attempts = 0;

    while (attempts < MAX_INTERNAL_ATTEMPTS) {
      attempts++;
      const params: Record<string, any> = {};

      // 1. Generate base values for each variable
      for (const v of variables) {
        if (v.type === "number" || v.type === "decimal") {
          const min = v.min !== undefined ? v.min : 1;
          const max = v.max !== undefined ? v.max : 100;
          if (min > max) {
            throw new BadRequestException({
              success: false,
              error: {
                code: "INVALID_SCHEMA",
                message: `Min value (${min}) cannot be greater than max value (${max}) for variable ${v.name}`,
              },
            });
          }

          if (v.type === "decimal") {
            const precision = v.precision !== undefined ? v.precision : 2;
            const rawVal = Math.random() * (max - min) + min;
            params[v.name] = parseFloat(rawVal.toFixed(precision));
          } else {
            // Integer strategy adjustments
            if (v.generator === "prime") {
              params[v.name] = getPrimeInRange(min, max);
            } else if (v.generator === "even") {
              const evens: number[] = [];
              for (let i = min; i <= max; i++) {
                if (i % 2 === 0) evens.push(i);
              }
              params[v.name] =
                evens.length > 0
                  ? evens[Math.floor(Math.random() * evens.length)]
                  : min;
            } else if (v.generator === "odd") {
              const odds: number[] = [];
              for (let i = min; i <= max; i++) {
                if (i % 2 !== 0) odds.push(i);
              }
              params[v.name] =
                odds.length > 0
                  ? odds[Math.floor(Math.random() * odds.length)]
                  : min;
            } else {
              params[v.name] =
                Math.floor(Math.random() * (max - min + 1)) + min;
            }
          }
        } else if (v.type === "string" && v.options && v.options.length > 0) {
          const index = Math.floor(Math.random() * v.options.length);
          params[v.name] = v.options[index];
        } else if (v.type === "boolean") {
          params[v.name] = Math.random() < 0.5;
        } else {
          params[v.name] = 1;
        }
      }

      // 2. Evaluate algebraic formula chains (Derived Variables)
      try {
        for (const formula of formulas) {
          if (typeof formula !== "string") continue;
          math.evaluate(formula, params);
        }
      } catch (err) {
        // If formula chain evaluation fails (e.g. division by zero), we retry
        continue;
      }

      // 3. Validate Constraints
      if (this.validateConstraints(params, constraints)) {
        // Clean mathjs fractions/objects to standard JSON types
        const cleanedParams: Record<string, any> = {};
        for (const [key, val] of Object.entries(params)) {
          if (typeof val === "object" && val !== null) {
            cleanedParams[key] = math.number(val as any);
          } else {
            cleanedParams[key] = val;
          }
        }
        return cleanedParams;
      }
    }

    throw new BadRequestException({
      success: false,
      error: {
        code: "CONSTRAINT_VIOLATION",
        message:
          "Failed to generate variables satisfying all template constraints after 50 attempts",
      },
    });
  }

  /**
   * Validates generated parameters against constraints rules.
   */
  private validateConstraints(
    params: Record<string, any>,
    constraints: any,
  ): boolean {
    const rules = constraints.rules || [];

    // Exclude duplicates check
    if (constraints.excludeDuplicates) {
      const values = Object.values(params);
      const uniqueValues = new Set(values);
      if (values.length !== uniqueValues.size) {
        return false;
      }
    }

    // Evaluate complex mathematical constraint rules using mathjs
    for (const rule of rules) {
      if (typeof rule !== "string") continue;
      try {
        const isValid = math.evaluate(rule, params);
        if (isValid === false) {
          return false;
        }
      } catch (err) {
        // If rule evaluation fails, discard this attempt
        return false;
      }
    }

    return true;
  }
}
