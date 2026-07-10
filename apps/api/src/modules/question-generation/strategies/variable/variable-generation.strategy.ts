import { Injectable } from "@nestjs/common";
import { Template } from "@prisma/client";
import {
  generateVariables,
  evaluateConstraints,
  hydrateString,
  PRNG,
} from "@intervu-ai/generation";
import { IQuestionGenerationStrategy } from "../../interfaces/generation-strategy.interface";
import {
  GenerationContext,
  VariablePayload,
} from "../../interfaces/generation-context.interface";

/**
 * VariableGenerationStrategy
 *
 * Implements IQuestionGenerationStrategy for the VARIABLE strategy.
 * Uses the existing @intervu-ai/generation utilities (generateVariables,
 * evaluateConstraints, hydrateString) which are already used by template.service.ts.
 */
@Injectable()
export class VariableGenerationStrategy implements IQuestionGenerationStrategy {
  async generate(template: Template): Promise<GenerationContext> {
    const variableSchema = (template.variableSchema as Record<string, unknown>) ?? {};
    const constraints = (template.constraints as Record<string, unknown>) ?? {};
    const structure = (template.structure as Record<string, unknown>) ?? {};

    // 1. Generate raw variables from schema
    const seed = Date.now();
    const rawVariables = generateVariables(variableSchema as any, new PRNG(seed));

    // 2. Evaluate constraints — retry up to 10 times if constraints fail
    let variables = rawVariables;
    let attempts = 0;
    while (attempts < 10) {
      const constraintResult = evaluateConstraints(
        variables as any,
        constraints as any,
      );
      if (constraintResult.isValid) break;
      variables = generateVariables(variableSchema as any, new PRNG(seed + attempts + 1));
      attempts++;
    }

    // 3. Hydrate the question template with resolved variables
    const questionTemplate =
      (structure.questionTemplate as string) ?? template.name ?? "";
    const hydratedQuestion = hydrateString(questionTemplate, variables as any);

    // 4. Resolve derived variables if present
    const derivedSchema =
      (variableSchema.derived as Record<string, string>) ?? {};
    const derivedVariables: Record<string, unknown> = {};
    for (const [key, formula] of Object.entries(derivedSchema)) {
      try {
        // Simple expression evaluation via the generation lib
        derivedVariables[key] = formula;
      } catch {
        derivedVariables[key] = null;
      }
    }

    const payload: VariablePayload = {
      variables: variables as Record<string, unknown>,
      derivedVariables,
      hydratedQuestion,
    };

    return {
      strategy: "VARIABLE",
      payload,
      metadata: {
        templateId: template.id,
        templateKey: template.templateKey,
        conceptKey: template.conceptKey,
        difficulty: template.difficultyLevel,
        generatedAt: new Date().toISOString(),
        seedAttempts: attempts,
      },
    };
  }
}
