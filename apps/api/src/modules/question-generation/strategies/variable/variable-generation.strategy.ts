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
  VariableData,
} from "../../interfaces/generation-context.interface";
import { PrismaService } from "../../../../prisma/prisma.service";

/**
 * VariableGenerationStrategy
 *
 * Implements IQuestionGenerationStrategy for the VARIABLE strategy.
 * Uses the existing @intervu-ai/generation utilities (generateVariables,
 * evaluateConstraints, hydrateString) which are already used by template.service.ts.
 */
@Injectable()
export class VariableGenerationStrategy implements IQuestionGenerationStrategy {
  constructor(private readonly prisma: PrismaService) {}

  async generate(template: Template): Promise<GenerationContext> {
    const varSchema = (template.variableSchema as any) ?? {};
    const consSchema = (template.constraints as any) ?? {};
    const structure = (template.structure as Record<string, unknown>) ?? {};

    // 1. Resolve variables definition
    let variablesDef: any[] = [];
    if (varSchema && Array.isArray(varSchema.variables)) {
      variablesDef = varSchema.variables;
    } else {
      const dbVars = await this.prisma.templateVariable.findMany({
        where: { templateId: template.id },
      });
      const dbRules = await this.prisma.templateRule.findMany({
        where: { templateId: template.id },
      });

      variablesDef = dbVars.map((v) => {
        const rulesForVar = dbRules.filter(
          (r: any) => r.ruleConfig?.variableName === v.variableName,
        );
        let min = 1;
        let max = 100;

        for (const rule of rulesForVar) {
          const config = rule.ruleConfig as any;
          if (config.min !== undefined && config.min !== null) {
            min = Math.max(min, config.min);
          }
          if (config.max !== undefined && config.max !== null) {
            max = Math.min(max, config.max);
          }
        }

        return {
          name: v.variableName,
          type: v.variableType.toLowerCase(),
          range: { min, max, step: 1 },
          defaultValue: v.defaultValue,
        };
      });
    }

    // 2. Resolve constraints definition
    let constraintsDef: any[] = [];
    if (consSchema && Array.isArray(consSchema.constraints)) {
      constraintsDef = consSchema.constraints;
    } else {
      const dbRules = await this.prisma.templateRule.findMany({
        where: { templateId: template.id },
      });
      constraintsDef = dbRules
        .map((r) => {
          const config = r.ruleConfig as any;
          let ruleStr = config.pattern || config.rule || "";

          // If it's a comparison rule, construct a mathJS-compatible expression
          if (
            !ruleStr &&
            config.variableName &&
            config.operator &&
            config.value
          ) {
            const op = config.operator === "=" ? "==" : config.operator;
            ruleStr = `${config.variableName} ${op} ${config.value}`;
          }

          return {
            rule: ruleStr,
            severity: "critical",
          };
        })
        .filter((c) => c.rule !== "");
    }

    // 3. Generate raw variables & evaluate constraints
    const seed = Date.now();
    let variables = generateVariables(variablesDef, new PRNG(seed));
    let attempts = 0;
    let constraintResult: any = { isValid: true };
    console.log(
      "DEBUG Generation Strategy: variablesDef =",
      JSON.stringify(variablesDef, null, 2),
    );
    console.log(
      "DEBUG Generation Strategy: constraintsDef =",
      JSON.stringify(constraintsDef, null, 2),
    );

    while (attempts < 10) {
      constraintResult = evaluateConstraints(constraintsDef, variables as any);
      console.log(
        `Attempt ${attempts}: variables =`,
        JSON.stringify(variables, null, 2),
        "isValid =",
        constraintResult.isValid,
        "violated =",
        JSON.stringify(constraintResult.violatedConstraints, null, 2),
      );
      if (constraintResult.isValid) break;
      variables = generateVariables(
        variablesDef,
        new PRNG(seed + attempts + 1),
      );
      attempts++;
    }

    // 4. Hydrate the question template with resolved variables
    const questionTemplate =
      (structure.questionStatement as string) ??
      (structure.questionTemplate as string) ??
      template.name ??
      "";
    const hydratedQuestion = hydrateString(questionTemplate, variables as any);

    // 5. Resolve derived variables if present
    const derivedSchema = (varSchema.derived as Record<string, string>) ?? {};
    const derivedVariables: Record<string, unknown> = {};
    for (const [key, formula] of Object.entries(derivedSchema)) {
      try {
        derivedVariables[key] = formula;
      } catch {
        derivedVariables[key] = null;
      }
    }

    const payload: VariableData = {
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
