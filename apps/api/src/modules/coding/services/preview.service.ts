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

    let aiPreviewNarrative = "";
    if (dto.generateStatement !== false) {
      const spec = (pattern?.statementSpecification as Record<string, any>) || {};
      const existingNarrative =
        spec.narrative ||
        spec.problemStatement ||
        (pattern?.metadata as Record<string, any>)?.narrative;

      if (existingNarrative && !dto.forceRegenerate) {
        aiPreviewNarrative = existingNarrative;
      } else {
        try {
          const aiStatement = await this.statementGenerator.generateStatement(
            {
              oracleKey,
              title: pattern?.title || "Coding Challenge",
              difficulty: difficulty || "MEDIUM",
              parameterSchema: parameterSchema || {},
              constraintSchema: constraintSchema || {},
              description: pattern?.description || "",
              statementSpecification: pattern?.statementSpecification || {},
            } as any,
            result,
          );
          aiPreviewNarrative = aiStatement.narrative;
        } catch (err) {
          aiPreviewNarrative = `Write a function to solve the problem for the given input parameters and return the expected result.\n\n### Sample Input\n\`\`\`json\n${JSON.stringify(result.generatedInput, null, 2)}\n\`\`\`\n\n### Expected Output\n\`\`\`json\n${JSON.stringify(result.expectedOutput, null, 2)}\n\`\`\``;
        }
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
