import { Injectable, BadRequestException } from "@nestjs/common";
import { evaluateExpression } from "@intervu-ai/generation";
import {
  formatDisplayString,
  normalizeDisplayQuestion,
  synthesizeNumericDistractors,
} from "../../generation-ai/utils/display-value-formatter";

interface InstantiatorInput {
  template: {
    id: string;
    templateKey: string;
    conceptKey: string;
    difficultyLevel: string;
    questionType: string;
    version: number;
    structure: any;
    solutionSchema: any;
  };
  parameters: Record<string, any>;
}

interface InstantiatedQuestion {
  questionText: string;
  answer: string;
  explanation: string;
  options: string[];
  difficulty: string;
  difficultyScore: number;
  metadata: any;
}

export function parseOptionsTemplate(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    if (
      raw.length === 1 &&
      typeof raw[0] === "string" &&
      raw[0].trim().startsWith("{")
    ) {
      try {
        const parsed = JSON.parse(raw[0]);
        if (parsed && Array.isArray(parsed.options)) {
          return parsed.options.map((o: any) => String(o));
        }
      } catch (e) {
        // Fall back to original array
      }
    }
    return raw.map((o: any) => (typeof o === "string" ? o : String(o)));
  }
  if (typeof raw === "string" && raw.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.options)) {
        return parsed.options.map((o: any) => String(o));
      }
    } catch (e) {
      // Fall back
    }
  }
  return [];
}

@Injectable()
export class QuestionInstantiatorService {
  /**
   * Instantiates a template with generated parameters.
   */
  instantiate(input: InstantiatorInput): InstantiatedQuestion {
    const { template, parameters } = input;
    const structure = template.structure || {};
    const solutionSchema = template.solutionSchema || {};

    const questionTemplate =
      structure.questionTemplate ||
      structure.questionStatement ||
      structure.prompt ||
      "";
    const explanationTemplate = structure.explanationTemplate || "";
    const optionsTemplate = parseOptionsTemplate(structure.optionsTemplate);

    // 2. Perform text interpolation
    const questionText = this.interpolate(questionTemplate, parameters);
    const explanation = this.interpolate(explanationTemplate, parameters);
    const options = optionsTemplate.map((opt: string) =>
      this.interpolate(opt, parameters),
    );

    // 3. Resolve/Calculate the correct answer
    const answer = this.resolveAnswer(solutionSchema, parameters, options);

    // 3.5 Generate distractors if options are missing for MCQs
    const isMcq = ["MCQ", "MULTIPLE_CHOICE", "MCQS", "MSQ"].includes(
      String(template.questionType || "MULTIPLE_CHOICE").toUpperCase(),
    );
    if (isMcq && options.length === 0 && answer && !isNaN(Number(answer))) {
      options.push(...synthesizeNumericDistractors(Number(answer), 4));
    }

    // 4. Calculate fine-grained difficulty score (lookahead requirement)
    const difficultyScore = this.calculateDifficultyScore(
      template.difficultyLevel,
      parameters,
    );

    // 5. Validation checks: placeholders resolved, answer and metadata exist
    if (this.hasUnresolvedPlaceholders(questionText)) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "UNRESOLVED_PLACEHOLDERS",
          message: "Generated question text contains unresolved placeholders",
        },
      });
    }

    if (!answer) {
      throw new BadRequestException({
        success: false,
        error: {
          code: "MISSING_ANSWER",
          message:
            "Failed to resolve or compute the correct answer for the template",
        },
      });
    }

    return normalizeDisplayQuestion({
      questionText,
      answer,
      explanation,
      options,
      difficulty: template.difficultyLevel,
      difficultyScore,
      metadata: {
        templateId: template.id,
        templateKey: template.templateKey,
        conceptKey: template.conceptKey,
        version: template.version,
        parameters,
      },
    });
  }

  /**
   * Helper to replace {{variableName}} with parameter values in a string.
   */
  private interpolate(text: string, params: Record<string, any>): string {
    if (!text) return "";
    return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, varName) => {
      return params.hasOwnProperty(varName)
        ? formatDisplayString(params[varName])
        : match;
    });
  }

  /**
   * Helper to check if a string contains unresolved placeholders.
   */
  private hasUnresolvedPlaceholders(text: string): boolean {
    return /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/.test(text);
  }

  /**
   * Resolves the correct answer based on formula or value definitions in solutionSchema.
   */
  private resolveAnswer(
    solutionSchema: any,
    params: Record<string, any>,
    options: string[],
  ): string {
    // If solutionSchema has a direct variable reference (e.g. { "correctVariable": "C" })
    if (
      solutionSchema.correctVariable &&
      params.hasOwnProperty(solutionSchema.correctVariable)
    ) {
      return formatDisplayString(params[solutionSchema.correctVariable]);
    }

    // If solutionSchema has a formula (e.g. { "formula": "A + B" })
    if (solutionSchema.formula) {
      try {
        const result = this.evaluateFormula(solutionSchema.formula, params);
        return formatDisplayString(result);
      } catch {
        // Fallback or bubble up
      }
    }

    // If solutionSchema exposes a finalAnswer expression.
    if (solutionSchema.finalAnswer) {
      try {
        const result = this.evaluateFormula(solutionSchema.finalAnswer, params);
        return formatDisplayString(result);
      } catch {
        // Fallback or bubble up
      }
    }

    // If solutionSchema defines an answer key index (e.g. { "correctOptionIndex": 0 })
    if (solutionSchema.correctOptionIndex !== undefined) {
      const idx = solutionSchema.correctOptionIndex;
      if (idx >= 0 && idx < options.length) {
        return options[idx];
      }
    }

    // Direct constant value fallback
    if (solutionSchema.value !== undefined) {
      return formatDisplayString(solutionSchema.value);
    }

    return "";
  }

  /**
   * Evaluates arithmetic and variable expressions using the shared generation engine.
   */
  private evaluateFormula(
    formula: string,
    params: Record<string, any>,
  ): unknown {
    return evaluateExpression(formula, params);
  }

  /**
   * Calculates fine-grained difficulty score between 0.0 and 1.0 (lookahead requirement).
   */
  private calculateDifficultyScore(
    difficultyLevel: string,
    params: Record<string, any>,
  ): number {
    let baseScore = 0.5;
    if (difficultyLevel === "EASY") baseScore = 0.2;
    if (difficultyLevel === "HARD") baseScore = 0.8;

    // Parameter Complexity Coefficient calculation:
    // Larger variable values or higher digit counts slightly bump up the difficulty score
    let complexitySum = 0;
    let count = 0;
    for (const val of Object.values(params)) {
      if (typeof val === "number") {
        complexitySum += Math.abs(val) > 50 ? 0.05 : 0.0;
        count++;
      }
    }

    const coefficient = count > 0 ? complexitySum / count : 0;
    return Math.min(1.0, Math.max(0.0, baseScore + coefficient));
  }
}
