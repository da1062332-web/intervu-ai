import { Injectable } from "@nestjs/common";
import * as math from "mathjs";
import { analyzeMathjsExpression, getUnsupportedMathjsFunctions } from "./expression-utils";

export interface StrategyDraftValidationResult {
  errors: string[];
  warnings: string[];
}

@Injectable()
export class StrategyCanonicalizationService {
  normalizeConstraintRule(rule: string): string {
    if (typeof rule !== "string") {
      return "";
    }

    const trimmed = rule.trim();
    if (!trimmed) {
      return "";
    }

    return trimmed.replace(/(?<![=!<>])=(?!=)/g, "==");
  }

  validateDraft(draft: any): StrategyDraftValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const variables = Array.isArray(draft?.variables) ? draft.variables : [];
    const derivedVariables = Array.isArray(draft?.derivedVariables)
      ? draft.derivedVariables
      : [];
    const constraints = Array.isArray(draft?.constraints) ? draft.constraints : [];

    const variableNames = new Set<string>();
    const derivedNames = new Set<string>();

    for (const variable of variables) {
      if (!variable?.name || typeof variable.name !== "string") {
        errors.push("Each variable must have a valid name.");
        continue;
      }

      const normalizedName = this.normalizeIdentifier(variable.name);
      if (!normalizedName) {
        errors.push("Each variable must have a valid name.");
        continue;
      }

      const lowerName = normalizedName.toLowerCase();
      if (variableNames.has(lowerName)) {
        errors.push(`Duplicate variable name: ${normalizedName}`);
      }
      variableNames.add(lowerName);

      if (
        variable.type === "number" ||
        variable.type === "integer" ||
        variable.type === "decimal"
      ) {
        if (variable.min !== undefined && variable.max !== undefined) {
          if (typeof variable.min !== "number" || typeof variable.max !== "number") {
            errors.push(`Variable ${normalizedName} must have numeric min and max values.`);
          } else if (variable.min > variable.max) {
            errors.push(
              `Variable ${normalizedName} has invalid range: min ${variable.min} cannot be greater than max ${variable.max}.`,
            );
          }
        }
      }
    }

    for (const derived of derivedVariables) {
      if (!derived?.name || typeof derived.name !== "string") {
        errors.push("Each derived variable must have a valid name.");
        continue;
      }

      const normalizedName = this.normalizeIdentifier(derived.name);
      if (!normalizedName) {
        errors.push("Each derived variable must have a valid name.");
        continue;
      }

      const lowerName = normalizedName.toLowerCase();
      if (derivedNames.has(lowerName)) {
        errors.push(`Duplicate derived variable name: ${normalizedName}`);
      }
      derivedNames.add(lowerName);

      if (!derived.expression || typeof derived.expression !== "string") {
        errors.push(`Derived variable ${normalizedName} must have a valid expression.`);
        continue;
      }

      if (variableNames.has(lowerName)) {
        errors.push(`Derived variable name ${normalizedName} conflicts with a base variable name.`);
      }

      const expression = derived.expression.trim();
      if (expression.includes("=")) {
        errors.push(
          `Derived variable ${normalizedName} must use a mathematical expression without assignment syntax.`,
        );
        continue;
      }

      const parseError = this.tryParseExpression(expression);
      if (!parseError) {
        errors.push(
          `Invalid derived variable expression for ${normalizedName}: ${expression}`,
        );
        continue;
      }

      const unsupportedFunctions = getUnsupportedMathjsFunctions(expression);
      if (unsupportedFunctions.length > 0) {
        errors.push(
          `Derived variable ${normalizedName} uses unsupported function(s): ${unsupportedFunctions.join(", ")}.`,
        );
        continue;
      }

      const identifiers = analyzeMathjsExpression(expression).identifiers;
      for (const identifier of identifiers) {
        if (!variableNames.has(identifier.toLowerCase()) && !derivedNames.has(identifier.toLowerCase())) {
          errors.push(
            `Derived variable ${normalizedName} references undefined identifier ${identifier}.`,
          );
        }
      }
    }

    const formulaDeps = new Map<string, string[]>();
    for (const derived of derivedVariables) {
      if (!derived?.name || typeof derived.name !== "string") {
        continue;
      }

      const normalizedName = this.normalizeIdentifier(derived.name);
      if (!normalizedName || typeof derived.expression !== "string") {
        continue;
      }

      const expression = derived.expression.trim();
      const deps = this.extractIdentifierNames(expression).filter(
        (dep) => dep.toLowerCase() !== normalizedName.toLowerCase(),
      );
      formulaDeps.set(normalizedName.toLowerCase(), deps);
    }

    const cycle = this.detectCycle(formulaDeps);
    if (cycle.length > 0) {
      errors.push(`Circular dependency in derived variables: ${cycle.join(" -> ")}`);
    }

    const parameterNames = new Set<string>([...variableNames, ...derivedNames]);
    for (const constraint of constraints) {
      if (!constraint?.rule || typeof constraint.rule !== "string") {
        errors.push("Each constraint must include a rule string.");
        continue;
      }

      const rule = constraint.rule.trim();
      const normalizedRule = this.normalizeConstraintRule(rule);
      if (!normalizedRule) {
        errors.push("Each constraint must include a rule string.");
        continue;
      }

      const unsupportedFunctions = getUnsupportedMathjsFunctions(normalizedRule);
      if (unsupportedFunctions.length > 0) {
        errors.push(
          `Constraint uses unsupported function(s): ${unsupportedFunctions.join(", ")}.`,
        );
        continue;
      }

      const parseError = this.tryParseExpression(normalizedRule);
      if (!parseError) {
        errors.push(
          `Invalid constraint rule: "${rule}". Constraint rules must be mathematical expressions.`,
        );
        continue;
      }

      const identifiers = analyzeMathjsExpression(normalizedRule).identifiers;
      for (const identifier of identifiers) {
        if (!parameterNames.has(identifier.toLowerCase())) {
          errors.push(`Constraint references undefined identifier ${identifier}.`);
        }
      }
    }

    if (variables.length === 0) {
      warnings.push("No variables were detected. Manual editing may be needed.");
    }

    if (variables.length > 20) {
      warnings.push(
        `High number of variables (${variables.length}). Ensure question is not overly complex.`,
      );
    }

    return { errors, warnings: warnings.slice(0, 5) };
  }

  private normalizeIdentifier(value: string): string {
    return value.trim().replace(/\s+/g, "_");
  }

  private tryParseExpression(expression: string): math.MathNode | null {
    try {
      return math.parse(expression);
    } catch {
      return null;
    }
  }

  private extractIdentifierNames(expression: string): string[] {
    return analyzeMathjsExpression(expression).identifiers;
  }

  private detectCycle(deps: Map<string, string[]>): string[] {
    const visited = new Set<string>();
    const stack = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string): string[] | null => {
      if (stack.has(node)) {
        const cycleStart = path.indexOf(node);
        return cycleStart >= 0 ? path.slice(cycleStart).concat(node) : [node];
      }

      if (visited.has(node)) {
        return null;
      }

      visited.add(node);
      stack.add(node);
      path.push(node);

      for (const neighbor of deps.get(node) || []) {
        const cycle = dfs(neighbor);
        if (cycle) {
          return cycle;
        }
      }

      stack.delete(node);
      path.pop();
      return null;
    };

    for (const node of deps.keys()) {
      const cycle = dfs(node);
      if (cycle) {
        return cycle;
      }
    }

    return [];
  }
}
