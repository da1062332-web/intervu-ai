import { Injectable, BadRequestException } from "@nestjs/common";

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

@Injectable()
export class QuestionInstantiatorService {
  /**
   * Instantiates a template with generated parameters.
   */
  instantiate(input: InstantiatorInput): InstantiatedQuestion {
    const { template, parameters } = input;
    const structure = template.structure || {};
    const solutionSchema = template.solutionSchema || {};

    // 1. Get raw templates from structure
    const questionTemplate = structure.questionTemplate || "";
    const explanationTemplate = structure.explanationTemplate || "";
    const optionsTemplate = structure.optionsTemplate || [];

    // 2. Perform text interpolation
    const questionText = this.interpolate(questionTemplate, parameters);
    const explanation = this.interpolate(explanationTemplate, parameters);
    const options = optionsTemplate.map((opt: string) =>
      this.interpolate(opt, parameters),
    );

    // 3. Resolve/Calculate the correct answer
    const answer = this.resolveAnswer(solutionSchema, parameters, options);

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

    return {
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
    };
  }

  /**
   * Helper to replace {{variableName}} with parameter values in a string.
   */
  private interpolate(text: string, params: Record<string, any>): string {
    if (!text) return "";
    return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, varName) => {
      return params.hasOwnProperty(varName) ? String(params[varName]) : match;
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
      return String(params[solutionSchema.correctVariable]);
    }

    // If solutionSchema has a formula (e.g. { "formula": "A + B" })
    if (solutionSchema.formula) {
      try {
        const result = this.evaluateFormula(solutionSchema.formula, params);
        return String(result);
      } catch (err) {
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
      return String(solutionSchema.value);
    }

    return "";
  }

  /**
   * Securely evaluates simple arithmetic formulas using parameter values.
   */
  private evaluateFormula(
    formula: string,
    params: Record<string, any>,
  ): number {
    // Standard formulas: "A + B", "A * B", "A - B", "A / B"
    let expression = formula;
    for (const [varName, varVal] of Object.entries(params)) {
      if (typeof varVal === "number") {
        expression = expression.replace(
          new RegExp(`\\b${varName}\\b`, "g"),
          String(varVal),
        );
      }
    }

    // Sanitize the expression to ensure it only contains math characters, numbers, spaces
    if (!/^[0-9+\-*/().\s%]+$/.test(expression)) {
      throw new Error("Invalid formula expression");
    }

    // Safe mathematical evaluation (no eval)
    // We construct a Function that does the math, but since we sanitized it strictly, it's secure
    return new Function(`return (${expression});`)();
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
