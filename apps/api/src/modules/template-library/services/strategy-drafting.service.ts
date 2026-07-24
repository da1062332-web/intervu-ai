import { Injectable, BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import { LLMAdapter } from "../../generation-ai/adapters/llm-adapter.interface";
import { AppLogger } from "@intervu-ai/shared-logger";

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

      return {
        success: true,
        data: normalized,
        validationWarnings: this.collectWarnings(normalized),
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
      "rule": "expression or comparison like 'totalCost = price * quantity' or 'totalCost > 100'",
      "severity": "critical|warning"
    }
  ],
  "notes": ["any observations or assumptions you made"]
}

Critical output rules:
- Return ONLY valid JSON. No markdown. No comments. No trailing text.
- The JSON keys must match the schema exactly: variables, derivedVariables, constraints, notes.
- Variables must be base inputs only. Derived variables must be mathematically computed from those base variables.
- Constraint rules must be simple parseable expressions that can be stored in the same manual schema format used by the template editor.
- Use clean identifier names with no spaces (e.g. total_cost, price, quantity).
- Infer reasonable numeric ranges when they are implied by the prompt.
- Prefer simple arithmetic relations over long prose.
- If a value is not explicitly given, choose a sensible default and mention it in notes.
- Keep each constraint rule as one straightforward string expression.
- Do NOT include placeholder-only terms or template boilerplate. Only variables that actually participate in the logic.
- Support only deterministic, arithmetic-based logic in this version.`;
  }

  /**
   * Parse and validate LLM response
   */
  private parseAndValidateResponse(response: string): any {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON object found in response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

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

    // Normalize variables
    if (Array.isArray(raw.variables)) {
      for (const v of raw.variables.slice(0, 50)) {
        // limit to 50 variables
        if (!v.name || typeof v.name !== "string") continue;

        const normalized_var: VariableDraft = {
          name: v.name.trim().replace(/\s+/g, "_"),
          type: this.normalizeVariableType(v.type),
          generator: this.normalizeGenerator(v.generator),
        };

        if (typeof v.min === "number") {
          normalized_var.min = v.min;
        }

        if (typeof v.max === "number") {
          normalized_var.max = v.max;
        }

        if (v.defaultValue !== undefined && v.defaultValue !== null) {
          normalized_var.defaultValue = v.defaultValue;
        }

        normalized.variables.push(normalized_var);
      }
    }

    // Normalize derived variables
    if (Array.isArray(raw.derivedVariables)) {
      for (const d of raw.derivedVariables.slice(0, 30)) {
        // limit to 30 derived
        if (!d.name || !d.expression) continue;

        normalized.derivedVariables.push({
          name: d.name.trim().replace(/\s+/g, "_"),
          expression: d.expression.trim(),
        });
      }
    }

    // Normalize constraints
    if (Array.isArray(raw.constraints)) {
      for (const c of raw.constraints.slice(0, 30)) {
        // limit to 30 constraints
        if (!c.rule) continue;

        normalized.constraints.push({
          rule: c.rule.trim(),
          severity: c.severity === "warning" ? "warning" : "critical",
        });
      }
    }

    return normalized;
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
