import { Injectable, BadRequestException } from "@nestjs/common";

interface VariableDefinition {
  name: string;
  type: "number" | "string" | "boolean" | string;
  min?: number;
  max?: number;
  options?: any[];
}

interface TemplateMetadata {
  variableSchema?: {
    variables?: VariableDefinition[];
    [key: string]: any;
  };
  constraints?: {
    rules?: string[];
    excludeDuplicates?: boolean;
    customConstraints?: any;
    [key: string]: any;
  };
  [key: string]: any;
}

@Injectable()
export class ParameterGeneratorService {
  /**
   * Generates parameters according to variable schemas and constraints.
   */
  generateParameters(metadata: TemplateMetadata): Record<string, any> {
    const variableSchema = metadata.variableSchema || {};
    const constraints = metadata.constraints || {};
    const variables = variableSchema.variables || [];

    const MAX_INTERNAL_ATTEMPTS = 50;
    let attempts = 0;

    while (attempts < MAX_INTERNAL_ATTEMPTS) {
      attempts++;
      const params: Record<string, any> = {};

      // 1. Generate candidate values for each variable
      for (const v of variables) {
        if (v.type === "number") {
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
          params[v.name] = Math.floor(Math.random() * (max - min + 1)) + min;
        } else if (v.type === "string" && v.options && v.options.length > 0) {
          const index = Math.floor(Math.random() * v.options.length);
          params[v.name] = v.options[index];
        } else if (v.type === "boolean") {
          params[v.name] = Math.random() < 0.5;
        } else {
          // Fallback default
          params[v.name] = 1;
        }
      }

      // 2. Validate Constraints
      if (this.validateConstraints(params, constraints)) {
        return params;
      }
    }

    throw new BadRequestException({
      success: false,
      error: {
        code: "CONSTRAINT_VIOLATION",
        message: "Failed to generate variables satisfying all template constraints after 50 attempts",
      },
    });
  }

  /**
   * Validates generated parameters against rules and checks.
   */
  private validateConstraints(params: Record<string, any>, constraints: any): boolean {
    const rules = constraints.rules || [];

    // Exclude duplicates check
    if (constraints.excludeDuplicates) {
      const values = Object.values(params);
      const uniqueValues = new Set(values);
      if (values.length !== uniqueValues.size) {
        return false;
      }
    }

    // Evaluate inequality/equality rules (e.g. "A != B", "A > B", "A % 2 == 0")
    for (const rule of rules) {
      if (typeof rule !== "string") continue;
      try {
        if (!this.evaluateRule(rule, params)) {
          return false;
        }
      } catch (err) {
        // If a rule is malformed, we fail validation for this attempt
        return false;
      }
    }

    return true;
  }

  /**
   * Safely evaluates simple expression rules using parameter values.
   */
  private evaluateRule(rule: string, params: Record<string, any>): boolean {
    // Standard rule example: "A != B", "A > B", "A % 2 == 0"
    // We parse and execute simple rules securely to avoid eval() vulnerabilities
    const tokens = rule.split(/\s+/);
    if (tokens.length < 3) return true;

    const leftName = tokens[0];
    const operator = tokens[1];
    const rightName = tokens[2];

    const leftVal = params.hasOwnProperty(leftName) ? params[leftName] : parseFloat(leftName);
    const rightVal = params.hasOwnProperty(rightName) ? params[rightName] : parseFloat(rightName);

    if (isNaN(leftVal) && typeof leftVal === "number") return false;
    if (isNaN(rightVal) && typeof rightVal === "number") return false;

    switch (operator) {
      case "==":
      case "===":
        return leftVal === rightVal;
      case "!=":
      case "!==":
        return leftVal !== rightVal;
      case ">":
        return leftVal > rightVal;
      case "<":
        return leftVal < rightVal;
      case ">=":
        return leftVal >= rightVal;
      case "<=":
        return leftVal <= rightVal;
      case "%":
        // Supporting e.g. "A % 2 == 0"
        if (tokens[3] === "==" || tokens[3] === "===") {
          const modVal = parseFloat(tokens[2]);
          const targetVal = parseFloat(tokens[4]);
          return (leftVal % modVal) === targetVal;
        }
        return false;
      default:
        return true;
    }
  }
}
