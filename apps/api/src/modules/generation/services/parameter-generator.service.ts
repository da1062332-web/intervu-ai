import { Injectable, BadRequestException } from "@nestjs/common";
import * as math from "mathjs";
import { PreviewGenerationException } from "../../../core/exceptions";

interface VariableDefinition {
  name: string;
  type: "number" | "string" | "boolean" | "decimal" | string;
  min?: number;
  max?: number;
  range?: {
    min?: number;
    max?: number;
    step?: number;
  };
  step?: number;
  options?: any[];
  generator?: "even" | "odd" | "prime" | string;
  precision?: number;
}

interface DerivedVariableDefinition {
  name: string;
  expression: string;
}

interface StrategyConstraintDefinition {
  rule?: string;
  expression?: string;
  target?: string;
  operator?: string;
  value?: unknown;
  [key: string]: any;
}

interface GenerationStrategyConfig {
  variables?: VariableDefinition[];
  derivedVariables?: DerivedVariableDefinition[];
  constraints?: StrategyConstraintDefinition[];
  formulas?: string[];
  [key: string]: any;
}

interface TemplateMetadata {
  variableSchema?: {
    variables?: VariableDefinition[];
    derivedVariables?: DerivedVariableDefinition[];
    formulas?: string[];
    generationStrategyConfig?: GenerationStrategyConfig;
    [key: string]: any;
  };
  constraints?: {
    rules?: string[];
    constraints?: StrategyConstraintDefinition[];
    excludeDuplicates?: boolean;
    customConstraints?: any;
    [key: string]: any;
  };
  generationStrategyConfig?: GenerationStrategyConfig;
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
    const resolved = this.resolveStrategyDefinition(metadata);
    const variables = resolved.variables;
    const formulas = resolved.formulas;
    const constraints = resolved.constraints;

    const MAX_INTERNAL_ATTEMPTS = 50;
    let attempts = 0;

    // Fast-path: If template defines no variables and no formulas (e.g. Verbal/Concept reasoning),
    // return an empty parameter map immediately without running mathematical constraint generation.
    if (variables.length === 0 && formulas.length === 0) {
      return {};
    }

    while (attempts < MAX_INTERNAL_ATTEMPTS) {
      attempts++;
      const params: Record<string, any> = {};

      // 1. Generate base values for each variable
      for (const v of variables) {
        const type = String(v.type || "").toLowerCase();
        const range = (v as any).range || {};
        const min =
          range.min !== undefined ? range.min : v.min !== undefined ? v.min : 1;
        const max =
          range.max !== undefined
            ? range.max
            : v.max !== undefined
              ? v.max
              : type === "decimal"
                ? 1.0
                : 100;
        const step =
          range.step !== undefined
            ? range.step
            : v.step !== undefined
              ? v.step
              : type === "decimal"
                ? undefined
                : 1;

        if (type === "number" || type === "decimal" || type === "integer") {
          if (min > max) {
            throw new BadRequestException({
              success: false,
              error: {
                code: "INVALID_SCHEMA",
                message: `Min value (${min}) cannot be greater than max value (${max}) for variable ${v.name}`,
              },
            });
          }

          const precision =
            v.precision !== undefined
              ? v.precision
              : type === "decimal"
                ? 2
                : 0;
          const generator = String(v.generator || "").toLowerCase();
          const boundedRandom = () => {
            if (step !== undefined && step > 0) {
              const maxSteps = Math.floor((max - min) / step);
              const stepIndex = Math.floor(Math.random() * (maxSteps + 1));
              return min + stepIndex * step;
            }
            return min + Math.random() * (max - min);
          };

          if (type === "decimal") {
            const rawVal = boundedRandom();
            params[v.name] = parseFloat(rawVal.toFixed(precision));
          } else {
            if (generator === "prime") {
              params[v.name] = getPrimeInRange(min, max);
            } else if (generator === "even") {
              const candidates: number[] = [];
              for (let i = min; i <= max; i++) {
                if (i % 2 === 0) candidates.push(i);
              }
              params[v.name] =
                candidates.length > 0
                  ? candidates[Math.floor(Math.random() * candidates.length)]
                  : Math.round(boundedRandom());
            } else if (generator === "odd") {
              const candidates: number[] = [];
              for (let i = min; i <= max; i++) {
                if (i % 2 !== 0) candidates.push(i);
              }
              params[v.name] =
                candidates.length > 0
                  ? candidates[Math.floor(Math.random() * candidates.length)]
                  : Math.round(boundedRandom());
            } else {
              params[v.name] = Math.round(boundedRandom());
            }
          }
        } else if (
          type === "string" &&
          Array.isArray((v as any).options) &&
          (v as any).options.length > 0
        ) {
          const options = (v as any).options;
          const index = Math.floor(Math.random() * options.length);
          params[v.name] = options[index];
        } else if ((v as any).defaultValue !== undefined) {
          params[v.name] = (v as any).defaultValue;
        } else if ((v as any).value !== undefined) {
          params[v.name] = (v as any).value;
        } else if (type === "string") {
          params[v.name] = v.name;
        } else if (type === "boolean") {
          params[v.name] = Math.random() < 0.5;
        } else {
          params[v.name] = 1;
        }
      }

      // 2. Evaluate algebraic formula chains (Derived Variables)
      try {
        for (const formula of formulas) {
          if (typeof formula !== "string") continue;
          const normalized = formula.trim();
          if (!normalized) continue;

          this.validateFormulaReferences(normalized, params, variables);

          if (normalized.includes("=")) {
            const [lhs, rhs] = normalized.split("=").map((part) => part.trim());
            if (lhs && rhs) {
              const result = math.evaluate(rhs, params);
              params[lhs] = this.normalizeMathValue(result);
              continue;
            }
          }

          const result = math.evaluate(normalized, params);
          if (typeof result === "object" && result !== null) {
            Object.assign(params, this.normalizeMathObject(result));
          }
        }
      } catch (err) {
        if (err instanceof PreviewGenerationException) {
          throw err;
        }

        // If formula chain evaluation fails (e.g. division by zero), we retry with new parameters
        continue;
      }

      // 3. Validate Constraints
      if (this.validateConstraints(params, constraints)) {
        // Clean mathjs fractions/objects to standard JSON types
        const cleanedParams: Record<string, any> = {};
        for (const [key, val] of Object.entries(params)) {
          cleanedParams[key] = this.normalizeMathValue(val);
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

  private resolveStrategyDefinition(metadata: TemplateMetadata): {
    variables: VariableDefinition[];
    formulas: string[];
    constraints: any;
  } {
    const variableSchema = metadata.variableSchema || {};
    const strategyConfig = metadata.generationStrategyConfig || {};

    const topLevelVariables = Array.isArray(variableSchema.variables)
      ? variableSchema.variables
      : [];
    const nestedStrategyVariables = Array.isArray(
      variableSchema.generationStrategyConfig?.variables,
    )
      ? variableSchema.generationStrategyConfig.variables
      : [];
    const variables = Array.isArray(strategyConfig.variables)
      ? strategyConfig.variables
      : topLevelVariables.length > 0
        ? topLevelVariables
        : nestedStrategyVariables;

    const derivedVariables = Array.isArray(strategyConfig.derivedVariables)
      ? strategyConfig.derivedVariables
      : [];

    const formulasFromDerived = derivedVariables
      .filter((entry) => entry && typeof entry.expression === "string")
      .map((entry) => `${entry.name} = ${entry.expression}`);

    const formulas = [
      ...(metadata.formulas || []),
      ...(variableSchema.formulas || []),
      ...formulasFromDerived,
    ];
    const formulaTargets = new Set(
      formulas
        .map((formula) => this.getFormulaTarget(formula))
        .filter((target): target is string => Boolean(target)),
    );

    const missingDerivedSources = [
      variableSchema.derivedVariables,
      variableSchema.generationStrategyConfig?.derivedVariables,
    ];
    for (const source of missingDerivedSources) {
      if (!Array.isArray(source)) continue;

      for (const entry of source) {
        if (!entry || typeof entry.expression !== "string" || !entry.name) {
          continue;
        }

        const target = String(entry.name).trim();
        if (!target || formulaTargets.has(target)) {
          continue;
        }

        formulas.push(`${target} = ${entry.expression}`);
        formulaTargets.add(target);
      }
    }

    const constraintSource =
      strategyConfig.constraints && Array.isArray(strategyConfig.constraints)
        ? { constraints: strategyConfig.constraints }
        : metadata.constraints || {};

    const constraints = {
      ...(constraintSource || {}),
      rules: this.normalizeConstraintRules(constraintSource),
    };

    return { variables, formulas, constraints };
  }

  private validateFormulaReferences(
    formula: string,
    params: Record<string, any>,
    variables: VariableDefinition[],
  ): void {
    if (typeof formula !== "string") {
      return;
    }

    const normalized = formula.trim();
    if (!normalized) {
      return;
    }

    const expression = normalized.includes("=")
      ? normalized.split("=").slice(1).join("=").trim()
      : normalized;

    const knownSymbols = new Set<string>([
      ...variables
        .map((variable) => String(variable.name).trim())
        .filter(Boolean),
      ...Object.keys(params),
    ]);

    const references = this.extractReferencedVariables(expression);
    const unknownReference = references.find((ref) => !knownSymbols.has(ref));

    if (!unknownReference) {
      return;
    }

    const target = normalized.includes("=")
      ? normalized.split("=")[0].trim()
      : "derived variable";

    throw new PreviewGenerationException("Template configuration error.", {
      category: "FORMULA_ERROR",
      retryable: false,
      source: "parameter-generator",
      reason: `Unknown variable '${unknownReference}' in formula '${formula}'`,
      context: {
        variable: target,
        formula: formula,
        unknownSymbol: unknownReference,
      },
    });
  }

  private extractReferencedVariables(expression: string): string[] {
    const reservedWords = new Set([
      "abs",
      "acos",
      "asin",
      "atan",
      "ceil",
      "cos",
      "e",
      "exp",
      "floor",
      "log",
      "max",
      "min",
      "mod",
      "pi",
      "pow",
      "round",
      "sin",
      "sqrt",
      "tan",
      "true",
      "false",
      "and",
      "or",
      "not",
      "if",
      "then",
      "else",
      "for",
      "while",
    ]);

    return Array.from(
      expression.matchAll(/[A-Za-z_][A-Za-z0-9_]*/g),
      (match) => match[0],
    ).filter((name) => !reservedWords.has(name));
  }

  private getFormulaTarget(formula: string): string | null {
    if (typeof formula !== "string" || !formula.includes("=")) {
      return null;
    }

    const [lhs] = formula.split("=").map((part) => part.trim());
    return lhs || null;
  }

  private normalizeConstraintRules(
    constraintSource: any,
  ): Array<string | StrategyConstraintDefinition> {
    if (!constraintSource) {
      return [];
    }

    if (
      Array.isArray(constraintSource.constraints) &&
      constraintSource.constraints.length > 0
    ) {
      return constraintSource.constraints;
    }

    if (Array.isArray(constraintSource.rules)) {
      return constraintSource.rules;
    }

    return [];
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
      const expression = this.buildConstraintExpression(rule);
      if (!expression) continue;

      try {
        const isValid = math.evaluate(expression, params);
        if (isValid === false) {
          return false;
        }
      } catch (err) {
        // If rule evaluation fails due to non-mathematical/descriptive syntax (e.g. natural language rules),
        // skip the non-mathematical rule rather than discarding the attempt.
        continue;
      }
    }

    return true;
  }

  private buildConstraintExpression(
    rule: string | StrategyConstraintDefinition,
  ): string {
    if (typeof rule === "string") {
      return rule;
    }

    if (!rule || typeof rule !== "object") {
      return "";
    }

    if (typeof rule.rule === "string" && rule.rule.trim()) {
      return rule.rule.replace(/(?<![=!<>])=(?!=)/g, "==");
    }

    if (typeof rule.expression === "string" && rule.expression.trim()) {
      return rule.expression.replace(/(?<![=!<>])=(?!=)/g, "==");
    }

    if (typeof rule.target === "string" && rule.target.trim()) {
      const target = rule.target.trim();
      const operator = typeof rule.operator === "string" ? rule.operator : "==";
      const value = this.formatConstraintValue(rule.value);
      return `${target} ${operator} ${value}`.replace(
        /(?<![=!<>])=(?!=)/g,
        "==",
      );
    }

    return "";
  }

  private formatConstraintValue(value: unknown): string {
    if (typeof value === "number") {
      return String(value);
    }

    if (typeof value === "string") {
      if (/^-?\d+(\.\d+)?$/.test(value)) {
        return value;
      }

      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
        return value;
      }

      return `'${value.replace(/'/g, "\\'")}'`;
    }

    return String(value);
  }

  private normalizeMathValue(value: any): any {
    if (value === undefined || value === null) return value;
    if (typeof value === "object") {
      try {
        return math.number(value as any);
      } catch {
        return value;
      }
    }
    return value;
  }

  private normalizeMathObject(value: any): Record<string, any> {
    const output: Record<string, any> = {};
    try {
      if (typeof value === "object" && value !== null) {
        for (const [key, val] of Object.entries(value)) {
          output[key] = this.normalizeMathValue(val);
        }
      }
    } catch {
      // ignore
    }
    return output;
  }
}
