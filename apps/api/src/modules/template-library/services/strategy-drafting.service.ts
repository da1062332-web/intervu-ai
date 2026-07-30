import { Injectable, BadRequestException, InternalServerErrorException, Inject } from "@nestjs/common";
import { parse } from "mathjs";
import { LLMAdapter } from "../../generation-ai/adapters/llm-adapter.interface";
import { AppLogger } from "@intervu-ai/shared-logger";
import { StrategyCanonicalizationService } from "./strategy-canonicalization.service";

export interface VariableDraft {
  name: string;
  type: "number" | "integer" | "decimal" | "boolean" | "string";
  min?: number;
  max?: number;
  defaultValue?: unknown;
  generator?: string;
}

export interface DerivedVariableDraft {
  name: string;
  expression: string;
}

export interface ConstraintDraft {
  rule: string;
  severity: "critical" | "warning";
}

export interface StrategyDraft {
  variables: VariableDraft[];
  derivedVariables: DerivedVariableDraft[];
  constraints: ConstraintDraft[];
  notes: string[];
}

export interface StrategyDraftResponse {
  success: boolean;
  data?: StrategyDraft;
  error?: string;
  validationWarnings?: string[];
}

/**
 * StrategyDraftingService
 *
 * Handles AI-assisted drafting of variable and constraint strategies from
 * plain-English descriptions. This service:
 * - receives natural language prompts
 * - calls the LLM to generate structured strategy data
 * - validates the output against a strict schema
 * - returns normalized, ready-to-apply strategy objects
 *
 * Does NOT persist data; only drafting. Persistence is handled by TemplateService.
 */
@Injectable()
export class StrategyDraftingService {
  private readonly logger = new AppLogger({ name: "StrategyDraftingService" });

  constructor(
    @Inject("LLM_ADAPTER") private readonly llmAdapter: LLMAdapter,
    private readonly canonicalizationService: StrategyCanonicalizationService,
  ) {}

  /**
   * Draft a strategy from plain-English description
   */
  async draftStrategy(prompt: string): Promise<StrategyDraftResponse> {
    try {
      // 1. Validate input
      if (!prompt || prompt.trim().length === 0) {
        throw new BadRequestException("Prompt cannot be empty");
      }

      if (prompt.trim().length > 2000) {
        throw new BadRequestException("Prompt exceeds 2000 character limit");
      }

      // 2. Build the drafting prompt
      const draftingPrompt = this.buildDraftingPrompt(prompt);

      // 3. Call LLM
      this.logger.debug("Calling LLM for strategy drafting", {
        promptLength: prompt.length,
      });

      const llmResponse = await this.llmAdapter.generate(draftingPrompt);

      // 4. Parse response
      const parsed = this.parseAndValidateResponse(llmResponse);

      // 5. Normalize the output
      const normalized = this.normalizeStrategy(parsed);
      const validation = this.canonicalizationService.validateDraft(normalized);
      if (validation.errors.length > 0) {
        const validationMessage = `Drafted strategy contains invalid constraint definitions: ${validation.errors.join("; ")}`;
        throw new BadRequestException(validationMessage);
      }

      return {
        success: true,
        data: normalized,
        validationWarnings: validation.warnings,
      };
    } catch (error: any) {
      this.logger.error("Strategy drafting failed", {
        error: error.message,
        stack: error.stack,
      });

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Strategy drafting failed: ${error.message}`,
      );
    }
  }

  /**
   * Build the system prompt for strategy drafting
   */
  private buildDraftingPrompt(userPrompt: string): string {
    return `You are an expert assessment question designer. A template author has described the logic for a question template.
Your task is to analyze their description and convert it into a structured strategy object.

IMPORTANT: Return ONLY valid JSON. No markdown, no explanations, no code blocks.

The user's description:
"${userPrompt}"

Analyze this and return a JSON object with this exact structure:
{
  "variables": [
    {
      "name": "variableName",
      "type": "number|integer|decimal|boolean|string",
      "min": <number or omit>,
      "max": <number or omit>,
      "defaultValue": <any or omit>,
      "generator": "random|even|odd|prime|static"
    }
  ],
  "derivedVariables": [
    {
      "name": "derivedName",
      "expression": "mathematical expression using variable names"
    }
  ],
  "constraints": [
    {
      "rule": "expression or comparison like 'totalCost == price * quantity' or 'totalCost > 100'",
      "severity": "critical|warning"
    }
  ],
  "notes": ["any observations or assumptions you made"]
}

Critical output rules:
- Return ONLY valid JSON. No markdown. No comments. No trailing text.
- The JSON keys must match the schema exactly: variables, derivedVariables, constraints, notes.
- Use 'variables' for base-domain requirements. If the prompt says something like "ages are integers between 10 and 70", represent it using 'type: "integer"', 'min: 10', and 'max: 70' for each age variable.
- Do NOT duplicate natural-language domain requirements inside 'constraints[].rule'.
- Derived variables must use 'expression' only, and that expression must contain only the mathematical right-hand side.
  Example: {"name": "avgRamMohan", "expression": "(ram_age + mohan_age) / 2"}
  Do NOT output 'avgRamMohan = (ram_age + mohan_age) / 2' inside 'expression'.
- 'constraints[].rule' must contain ONLY machine-parseable mathematical expressions or comparisons using declared identifiers and supported operators.
  Valid examples: 'avgRamMohan % 1 == 0', 'difference1 > 0', 'difference1 % 1 == 0', 'avgRamMohan > avgMohanJitesh'.
  Invalid examples: 'ages are integers between 10 and 70', 'avgRamMohan is an integer', 'difference1 is a positive integer', 'jitesh_age is uniquely solvable'.
- Use '==' for equality comparisons in constraints, not single '='.
- For integer requirements on derived values, represent them with parseable math constraints such as 'avgRamMohan % 1 == 0'.
- For positive integer requirements, represent them with supported math constraints such as 'difference1 > 0' and optionally 'difference1 % 1 == 0'.
- If the prompt contains a semantic requirement like "uniquely solvable" that has no formal field, use it as guidance when choosing variables and relations, and optionally include it in 'notes', but do not encode it as a 'constraints[].rule' sentence.
- Keep each constraint rule as one straightforward string expression.
- Do NOT include placeholder-only terms or template boilerplate. Only variables that actually participate in the logic.
- Support only deterministic, arithmetic-based logic in this version.`;
  }

  /**
   * Parse and validate LLM response
   */
  private parseAndValidateResponse(response: string): any {
    try {
      const cleaned = response
        .replace(/```(?:json)?/gi, '')
        .trim();

      const jsonText = this.extractFirstJsonObject(cleaned);
      if (!jsonText) {
        throw new Error('No JSON object found in response');
      }

      const parsed = JSON.parse(jsonText);

      // Validate top-level structure
      if (!parsed.variables || !Array.isArray(parsed.variables)) {
        throw new Error("Missing or invalid 'variables' array");
      }

      if (!parsed.derivedVariables) {
        parsed.derivedVariables = [];
      }

      if (!parsed.constraints) {
        parsed.constraints = [];
      }

      if (!parsed.notes) {
        parsed.notes = [];
      }

      return parsed;
    } catch (error: any) {
      throw new BadRequestException(
        `Failed to parse LLM response: ${error.message}`,
      );
    }
  }

  private extractFirstJsonObject(input: string): string | null {
    let depth = 0;
    let inString = false;
    let escape = false;
    let startIndex = -1;

    for (let index = 0; index < input.length; index++) {
      const char = input[index];

      if (inString) {
        if (escape) {
          escape = false;
        } else if (char === '\\') {
          escape = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
        continue;
      }

      if (char === '{') {
        if (depth === 0) {
          startIndex = index;
        }
        depth += 1;
        continue;
      }

      if (char === '}') {
        if (depth > 0) {
          depth -= 1;
          if (depth === 0 && startIndex >= 0) {
            return input.slice(startIndex, index + 1);
          }
        }
      }
    }

    return null;
  }

  /**
   * Normalize and validate the strategy
   */
  private normalizeStrategy(raw: any): StrategyDraft {
    const normalized: StrategyDraft = {
      variables: [],
      derivedVariables: [],
      constraints: [],
      notes: Array.isArray(raw.notes) ? raw.notes.slice(0, 10) : [],
    };

    const seenVariableNames = new Set<string>();
    if (Array.isArray(raw.variables)) {
      for (const v of raw.variables.slice(0, 50)) {
        if (!v?.name || typeof v.name !== "string") continue;

        const name = v.name.trim().replace(/\s+/g, "_");
        if (!name || seenVariableNames.has(name.toLowerCase())) continue;
        seenVariableNames.add(name.toLowerCase());

        const type = this.normalizeVariableType(v.type);
        const min = this.normalizeNumberValue(v.min);
        const max = this.normalizeNumberValue(v.max);
        const defaultValue = this.normalizeDefaultValue(v.defaultValue, type);

        if (min !== undefined && max !== undefined && min > max) {
          throw new BadRequestException(
            `Variable "${name}" has invalid range: min (${min}) must be less than or equal to max (${max}).`,
          );
        }

        const normalizedVar: VariableDraft = {
          name,
          type,
          generator: this.normalizeGenerator(v.generator),
        };

        if (min !== undefined) normalizedVar.min = min;
        if (max !== undefined) normalizedVar.max = max;
        if (defaultValue !== undefined) normalizedVar.defaultValue = defaultValue;

        normalized.variables.push(normalizedVar);
      }
    }

    const seenDerivedNames = new Set<string>();
    if (Array.isArray(raw.derivedVariables)) {
      for (const d of raw.derivedVariables.slice(0, 30)) {
        if (!d?.name || !d?.expression) continue;

        const name = d.name.trim().replace(/\s+/g, "_");
        if (!name || seenDerivedNames.has(name.toLowerCase())) continue;
        seenDerivedNames.add(name.toLowerCase());

        normalized.derivedVariables.push({
          name,
          expression: d.expression.trim(),
        });
      }
    }

    if (Array.isArray(raw.constraints)) {
      for (const c of raw.constraints.slice(0, 100)) {
        if (!c?.rule || typeof c.rule !== "string") continue;

        normalized.constraints.push({
          rule: this.canonicalizationService.normalizeConstraintRule(c.rule.trim()),
          severity: c.severity === "warning" ? "warning" : "critical",
        });
      }
    }

    return normalized;
  }

  private normalizeNumberValue(value: unknown): number | undefined {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value.trim());
      return Number.isFinite(parsed) ? parsed : undefined;
    }

    return undefined;
  }

  private normalizeDefaultValue(
    value: unknown,
    type: "number" | "integer" | "decimal" | "boolean" | "string",
  ): unknown {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (type === "number" || type === "integer" || type === "decimal") {
      const parsed = this.normalizeNumberValue(value);
      return parsed !== undefined ? parsed : value;
    }

    if (type === "boolean") {
      if (typeof value === "boolean") return value;
      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "true") return true;
        if (normalized === "false") return false;
      }
    }

    return value;
  }

  private validateDraft(strategy: StrategyDraft): string[] {
    const warnings: string[] = [];

    if (strategy.variables.length === 0) {
      warnings.push("No variables were detected. Manual editing may be needed.");
    }

    if (strategy.variables.length > 20) {
      warnings.push(
        `High number of variables (${strategy.variables.length}). Ensure question is not overly complex.`,
      );
    }

    const baseVarNames = new Set(
      strategy.variables.map((v) => v.name.toLowerCase()),
    );
    const derivedVarNames = new Set(
      strategy.derivedVariables.map((d) => d.name.toLowerCase()),
    );

    for (const derived of strategy.derivedVariables) {
      if (!derived.expression) {
        warnings.push(`Derived variable "${derived.name}" has an empty expression.`);
        continue;
      }

      this.validateExpressionSyntax(
        derived.expression,
        false,
        `Derived variable "${derived.name}"`,
      );

      const mentioned = this.extractIdentifiers(derived.expression);
      const orphaned = mentioned.filter(
        (name) =>
          !baseVarNames.has(name) && !derivedVarNames.has(name),
      );
      if (orphaned.length > 0) {
        warnings.push(
          `Derived variable "${derived.name}" references undefined variables: ${orphaned.join(", ")}`,
        );
      }
    }

    const cycle = this.findDerivedCycle(strategy.derivedVariables);
    if (cycle) {
      throw new BadRequestException(
        `Circular derived variable dependency detected: ${cycle.join(" -> ")}`,
      );
    }

    for (const constraint of strategy.constraints) {
      if (!constraint.rule) {
        warnings.push("One of the constraints is empty and was ignored.");
        continue;
      }

      this.validateExpressionSyntax(
        constraint.rule,
        true,
        `Constraint rule`,
      );

      const mentioned = this.extractIdentifiers(constraint.rule);
      const undefinedVars = mentioned.filter(
        (name) =>
          !baseVarNames.has(name) && !derivedVarNames.has(name),
      );
      if (undefinedVars.length > 0) {
        warnings.push(
          `Constraint references undefined variables: ${undefinedVars.join(", ")}`,
        );
      }
    }

    for (const variable of strategy.variables) {
      const generator = variable.generator || 'random';

      if (
        (variable.type === "string" || variable.type === "boolean") &&
        ["prime", "even", "odd"].includes(generator)
      ) {
        warnings.push(
          `Generator "${generator}" may not be compatible with variable type "${variable.type}" for variable "${variable.name}".`,
        );
      }

      if (variable.type === "decimal" && ["prime", "even", "odd"].includes(generator)) {
        warnings.push(
          `Generator "${generator}" is only valid for integer variables. Variable "${variable.name}" is decimal.`,
        );
      }

      if (variable.type === "integer") {
        if (
          variable.min !== undefined &&
          !Number.isInteger(variable.min)
        ) {
          warnings.push(
            `Variable "${variable.name}" is integer type but min is not an integer.`,
          );
        }

        if (
          variable.max !== undefined &&
          !Number.isInteger(variable.max)
        ) {
          warnings.push(
            `Variable "${variable.name}" is integer type but max is not an integer.`,
          );
        }

        if (
          typeof variable.defaultValue === "number" &&
          !Number.isInteger(variable.defaultValue)
        ) {
          warnings.push(
            `Variable "${variable.name}" is integer type but defaultValue is not an integer.`,
          );
        }
      }
    }

    return warnings.slice(0, 5);
  }

  private validateExpressionSyntax(
    expression: string,
    isConstraint: boolean,
    label: string,
  ) {
    if (!expression || typeof expression !== "string") {
      throw new BadRequestException(`${label} must be a valid expression.`);
    }

    const source = isConstraint
      ? this.normalizeConstraintRuleForParsing(expression)
      : expression;

    try {
      parse(source);
    } catch (error: any) {
      throw new BadRequestException(
        `${label} has invalid syntax: ${error?.message || error}`,
      );
    }
  }

  private normalizeConstraintRuleForParsing(rule: string): string {
    return rule.replace(/(?<![=!<>])=(?!=)/g, "==");
  }

  private extractIdentifiers(expression: string): string[] {
    return Array.from(
      new Set(
        (expression.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || []).map((token) =>
          token.toLowerCase(),
        ),
      ),
    );
  }

  private findDerivedCycle(
    derivedVariables: DerivedVariableDraft[],
  ): string[] | null {
    const graph = new Map<string, string[]>();
    const derivedNames = new Set(
      derivedVariables.map((d) => d.name.toLowerCase()),
    );

    for (const derived of derivedVariables) {
      const name = derived.name.toLowerCase();
      const references = this.extractIdentifiers(derived.expression).filter(
        (token) => derivedNames.has(token) && token !== name,
      );
      graph.set(name, references);
    }

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

      for (const neighbor of graph.get(node) || []) {
        const cycle = dfs(neighbor);
        if (cycle) return cycle;
      }

      stack.delete(node);
      path.pop();
      return null;
    };

    for (const node of graph.keys()) {
      const cycle = dfs(node);
      if (cycle) {
        return cycle;
      }
    }

    return null;
  }

  /**
   * Normalize variable type
   */
  private normalizeVariableType(
    type: unknown,
  ): "number" | "integer" | "decimal" | "boolean" | "string" {
    if (typeof type !== "string") return "number";

    const lower = type.toLowerCase();
    if (lower === "integer" || lower === "int") return "integer";
    if (lower === "decimal" || lower === "float" || lower === "double")
      return "decimal";
    if (lower === "boolean" || lower === "bool") return "boolean";
    if (lower === "string" || lower === "text") return "string";

    return "number";
  }

  /**
   * Normalize generator mode
   */
  private normalizeGenerator(
    generator: unknown,
  ): string {
    if (typeof generator !== "string") return "random";

    const lower = generator.toLowerCase();
    if (
      lower === "even" ||
      lower === "odd" ||
      lower === "prime" ||
      lower === "static"
    ) {
      return lower;
    }

    return "random";
  }

  /**
   * Collect validation warnings from the strategy
   */
  private collectWarnings(strategy: StrategyDraft): string[] {
    const warnings: string[] = [];

    // Check for potentially problematic patterns
    if (strategy.variables.length === 0) {
      warnings.push("No variables were detected. Manual editing may be needed.");
    }

    if (strategy.variables.length > 20) {
      warnings.push(`High number of variables (${strategy.variables.length}). Ensure question is not overly complex.`);
    }

    // Check for derived variables without matching base variables
    const baseVarNames = new Set(
      strategy.variables.map((v) => v.name.toLowerCase()),
    );
    for (const derived of strategy.derivedVariables) {
      const mentioned = derived.expression
        .toLowerCase()
        .match(/\b[a-z_][a-z0-9_]*\b/g) || [];
      const orphaned = mentioned.filter(
        (name) => !baseVarNames.has(name.toLowerCase()),
      );
      if (orphaned.length > 0) {
        warnings.push(
          `Derived variable "${derived.name}" references undefined variables: ${orphaned.join(", ")}`,
        );
      }
    }

    // Check for constraints on undefined variables
    for (const constraint of strategy.constraints) {
      const mentioned = constraint.rule
        .toLowerCase()
        .match(/\b[a-z_][a-z0-9_]*\b/g) || [];
      const undefined_vars = mentioned.filter(
        (name) =>
          !baseVarNames.has(name.toLowerCase()) &&
          !new Set(strategy.derivedVariables.map((d) => d.name.toLowerCase())).has(
            name.toLowerCase(),
          ),
      );
      if (undefined_vars.length > 0) {
        warnings.push(
          `Constraint references undefined variables: ${undefined_vars.join(", ")}`,
        );
      }
    }

    return warnings.slice(0, 5); // Return top 5 warnings
  }
}
