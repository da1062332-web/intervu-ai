import { BadRequestException, Injectable } from "@nestjs/common";
import { PatternExecutionService } from "./pattern-execution.service";
import { CodingPatternRegistryService } from "./coding-pattern-registry.service";
import { CodingOracleService } from "./coding-oracle.service";
import { PreviewCodingPatternDto } from "../dto/preview-coding-pattern.dto";
import { PatternPreviewResponseDto } from "../dto/pattern-preview-response.dto";
import { CodingStatementGeneratorService } from "./coding-statement-generator.service";

@Injectable()
export class PreviewService {
  constructor(
    private readonly executionService: PatternExecutionService,
    private readonly registryService: CodingPatternRegistryService,
    private readonly oracleService: CodingOracleService,
    private readonly statementGenerator: CodingStatementGeneratorService,
  ) {}

  async generatePreview(dto: PreviewCodingPatternDto): Promise<PatternPreviewResponseDto> {
    let oracleKey = dto.oracleKey;
    let parameterSchema = dto.parameterSchema;
    let constraintSchema = dto.constraintSchema;
    let difficulty = dto.difficulty;

    let starterCode: Record<string, any> | null = null;
    let pattern: any = null;

    if (dto.patternId) {
      pattern = await this.registryService.resolvePattern(dto.patternId);
      oracleKey = oracleKey || pattern.oracleKey || undefined;
      parameterSchema = parameterSchema || (pattern.parameterSchema as Record<string, any>);
      constraintSchema = constraintSchema || (pattern.constraintSchema as Record<string, any>);
      difficulty = difficulty || pattern.difficulty;
      if (pattern.starterCode && typeof pattern.starterCode === "object" && Object.keys(pattern.starterCode).length > 0) {
        starterCode = pattern.starterCode as Record<string, any>;
      }
    }

    if (!oracleKey) {
      throw new BadRequestException("Either patternId or oracleKey must be provided to generate preview.");
    }

    await this.oracleService.validateOracleForUsage(oracleKey);

    const seed = dto.seed ?? Math.floor(Math.random() * 100000);

    const result = await this.executionService.executePattern(
      {
        oracleKey,
        parameterSchema,
        constraintSchema,
        difficulty,
      },
      seed,
    );

    let aiPreviewNarrative = "[AI Narrative Statement Preview will be generated in Phase 3]";
    if (dto.generateStatement) {
      try {
        const aiStatement = await this.statementGenerator.generateStatement(
          {
            oracleKey,
            title: pattern?.title || "Coding Challenge",
            difficulty: difficulty || "MEDIUM",
            parameterSchema: parameterSchema || {},
            constraintSchema: constraintSchema || {},
            description: pattern?.description || "",
          } as any,
          result,
        );
        aiPreviewNarrative = aiStatement.narrative;
      } catch (err) {
        aiPreviewNarrative = "[Failed to generate AI statement preview. Try again.]";
      }
    }

    return {
      parameters: result.parameters,
      generatedInput: result.generatedInput,
      expectedOutput: result.expectedOutput,
      publicTests: result.publicTests,
      hiddenTests: result.hiddenTests,
      stressTests: result.stressTests,
      boundaryTests: result.boundaryTests,
      validation: result.validation,
      aiPreview: {
        narrative: aiPreviewNarrative,
        codeSkeletons: starterCode,
      },
    };
  }
}
