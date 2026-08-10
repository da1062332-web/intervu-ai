import { Injectable } from "@nestjs/common";
import { GenerationStrategy, Template } from "@prisma/client";
import { IQuestionGenerationStrategy } from "../../interfaces/generation-strategy.interface";
import { GenerationContext, CodingPatternPayload } from "../../interfaces/generation-context.interface";
import { CodingPatternSelectorService } from "../../../coding/services/coding-pattern-selector.service";
import { PatternExecutionService } from "../../../coding/services/pattern-execution.service";
import { CodingStatementGeneratorService } from "../../../coding/services/coding-statement-generator.service";
import { OracleRegistry } from "../../../coding/oracles/oracle.registry";

/**
 * Derives the return type of the Oracle by inspecting its output structure.
 * Runs a dry-run generateExpectedOutput call with a minimal input to check the type.
 */
function deriveReturnType(oracle: any): string {
  try {
    // Use the Oracle's own parameterSchema defaults to produce a sample input
    const sampleParams: Record<string, any> = {};
    const schema = oracle.parameterSchema || {};
    for (const [key, def] of Object.entries(schema as Record<string, any>)) {
      sampleParams[key] = def.default ?? (def.type === "integer" ? 2 : []);
    }
    const sampleInput = oracle.generateInput(sampleParams);
    const sampleOutput = oracle.generateExpectedOutput(sampleInput);
    const result = sampleOutput?.result;

    if (typeof result === "boolean") return "BOOLEAN";
    if (typeof result === "number") return "NUMBER";
    if (typeof result === "string") return "STRING";
    if (Array.isArray(result)) return "ARRAY";
    return "OBJECT";
  } catch {
    return "UNKNOWN";
  }
}

/**
 * Derives the input type of the Oracle's primary input parameter.
 */
function deriveInputType(oracle: any): string {
  try {
    const schema = oracle.parameterSchema || {};
    const firstParam = Object.values(schema as Record<string, any>)[0] as any;
    if (!firstParam) {
      // Try generating input with empty params and inspect
      const sampleInput = oracle.generateInput({});
      const values = Object.values(sampleInput);
      if (values.length > 0) {
        const v = values[0];
        if (typeof v === "number") return "INTEGER";
        if (Array.isArray(v)) return "ARRAY";
        if (typeof v === "string") return "STRING";
      }
      return "UNKNOWN";
    }
    const type = (firstParam.type || "").toLowerCase();
    if (type === "integer" || type === "number") return "INTEGER";
    if (type === "array") return "ARRAY";
    if (type === "string") return "STRING";
    return "UNKNOWN";
  } catch {
    return "UNKNOWN";
  }
}

@Injectable()
export class CodingPatternGenerationStrategy implements IQuestionGenerationStrategy {
  constructor(
    private readonly selectorService: CodingPatternSelectorService,
    private readonly executionService: PatternExecutionService,
    private readonly statementGenerator: CodingStatementGeneratorService,
    private readonly oracleRegistry: OracleRegistry,
  ) {}

  async generate(template: Template): Promise<GenerationContext> {
    const meta = (((template as any).metadata || (template as any).config || {}) as Record<string, any>);

    // 1. Select matching CodingPattern
    const pattern = await this.selectorService.selectPattern({
      conceptKey: template.conceptKey,
      difficulty: template.difficultyLevel,
      recentlyUsedPatternIds: meta.recentlyUsedPatternIds || [],
      allowDraft: false,
    });

    // 2. Execute deterministic pattern pipeline (PRNG seed + Oracle compute + Test suites + Validation)
    const seed = meta.seed ? Number(meta.seed) : Math.floor(Math.random() * 1000000);
    const executionResult = await this.executionService.executePattern(
      {
        oracleKey: pattern.oracleKey,
        parameterSchema: (pattern.parameterSchema as Record<string, any>) || {},
        constraintSchema: (pattern.constraintSchema as Record<string, any>) || {},
        difficulty: pattern.difficulty,
      },
      seed,
    );

    // 3. Generate AI narrative (strictly non-modifying to Oracle inputs/outputs)
    const aiStatement = await this.statementGenerator.generateStatement(
      pattern,
      executionResult,
    );

    // 4. Derive statementSpecification from the LIVE Oracle instance (authoritative source of truth).
    //    This overrides any stale values stored in pattern.statementSpecification in the DB.
    let oracleProblemType = "UNKNOWN";
    let oracleReturnType = "UNKNOWN";
    let oracleInputType = "UNKNOWN";

    try {
      const oracle = this.oracleRegistry.getOracle(pattern.oracleKey);
      oracleProblemType = (oracle.category || "UNKNOWN").toString().toUpperCase();
      oracleReturnType = deriveReturnType(oracle);
      oracleInputType = deriveInputType(oracle);
    } catch {
      // Oracle not available in registry — fall back to keyword heuristic
      const k = (pattern.oracleKey || "").toUpperCase();
      oracleProblemType = k.includes("MATH") || k.includes("PRIME") ? "MATH"
        : k.includes("ARRAY") || k.includes("ROTAT") ? "ARRAY"
        : k.includes("STRING") ? "STRING"
        : "GENERAL";
      oracleReturnType = k.includes("PRIME") || k.includes("CHECK") || k.includes("BOOL") ? "BOOLEAN" : "ARRAY";
      oracleInputType = k.includes("MATH") || k.includes("PRIME") ? "INTEGER" : "ARRAY";
    }

    // Merge: Oracle-derived values take authoritative precedence.
    // Any extra fields from pattern.statementSpecification (e.g. custom descriptions) are preserved.
    const patternSpec = (pattern.statementSpecification as Record<string, any>) || {};
    const statementSpecification = {
      ...patternSpec,           // DB extras (custom fields) kept
      problemType: oracleProblemType,   // Oracle category always wins
      returnType: oracleReturnType,     // Oracle output type always wins
      inputType: oracleInputType,       // Oracle input type always wins
    };

    const payload: CodingPatternPayload = {
      patternId: pattern.id,
      patternKey: pattern.patternKey,
      oracleKey: pattern.oracleKey,
      seed,
      parameters: executionResult.parameters,
      generatedInput: executionResult.generatedInput,
      expectedOutput: executionResult.expectedOutput,
      publicTests: executionResult.publicTests,
      hiddenTests: executionResult.hiddenTests,
      stressTests: executionResult.stressTests,
      boundaryTests: executionResult.boundaryTests,
      starterCode: (pattern.starterCode as Record<string, any>) || {},
      statementSpecification,
      aiStatement,
    };

    return {
      strategy: GenerationStrategy.CODING_PATTERN,
      payload,
      metadata: {
        templateId: template.id,
        templateKey: template.templateKey,
        conceptKey: template.conceptKey,
        difficulty: template.difficultyLevel,
        patternId: pattern.id,
        patternKey: pattern.patternKey,
        oracleKey: pattern.oracleKey,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}
