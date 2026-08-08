import { Injectable } from "@nestjs/common";
import { OracleRegistry } from "../oracles/oracle.registry";
import { SeededParameterGeneratorService } from "../generators/seeded-parameter-generator.service";
import { TestSuiteGeneratorService } from "../generators/test-suite-generator.service";
import { PatternValidatorService, PatternValidationResult } from "../validators/pattern-validator.service";
import { CodingOracleService } from "./coding-oracle.service";
import { DifficultyLevel } from "@prisma/client";

export interface PatternExecutionConfig {
  oracleKey: string;
  parameterSchema?: Record<string, any>;
  constraintSchema?: Record<string, any>;
  difficulty?: DifficultyLevel;
}

export interface PatternExecutionResultPayload {
  parameters: Record<string, any>;
  generatedInput: Record<string, any>;
  expectedOutput: Record<string, any>;
  publicTests: Array<{ input: any; expectedOutput: any; explanation?: string }>;
  hiddenTests: Array<{ input: any; expectedOutput: any }>;
  stressTests: Array<{ input: any; expectedOutput: any }>;
  boundaryTests: Array<{ input: any; expectedOutput: any }>;
  validation: PatternValidationResult;
}

@Injectable()
export class PatternExecutionService {
  constructor(
    private readonly oracleRegistry: OracleRegistry,
    private readonly paramGenerator: SeededParameterGeneratorService,
    private readonly testSuiteGenerator: TestSuiteGeneratorService,
    private readonly validatorService: PatternValidatorService,
    private readonly oracleService: CodingOracleService,
  ) {}

  /**
   * Executes complete materialization pipeline for a coding pattern.
   */
  async executePattern(
    config: PatternExecutionConfig,
    seed: number = 42,
  ): Promise<PatternExecutionResultPayload> {
    // 0. Validate Oracle availability (database active status & backend provider)
    await this.oracleService.validateOracleForUsage(config.oracleKey);

    // 1. Resolve Oracle instance from factory
    const oracle = this.oracleRegistry.getOracle(config.oracleKey);

    // 2. Resolve parameter schema (from config or from oracle.parameterSchema)
    const parameterSchema =
      config.parameterSchema && Object.keys(config.parameterSchema).length > 0
        ? config.parameterSchema
        : oracle.parameterSchema || {};

    // 3. Generate deterministic parameters
    const generatedParameters = this.paramGenerator.generateParameters(
      parameterSchema,
      seed,
    );

    // 4. Generate input & expected output via Oracle
    const generatedInput = oracle.generateInput(generatedParameters);
    const expectedOutput = oracle.generateExpectedOutput(generatedInput);

    // Merge parameters so parameters returned in payload reflects actual parameter set used for primary generated input
    const parameters = { ...generatedInput, ...generatedParameters };

    // 5. Generate Test Suite with seed
    const testSuite = this.testSuiteGenerator.generateTestSuite(
      oracle,
      parameters,
      seed,
    );

    // 6. Run validation pipeline
    const constraintSchema = config.constraintSchema || {};
    const validation = this.validatorService.validateAll({
      parameters,
      parameterSchema,
      input: generatedInput,
      output: expectedOutput,
      constraintSchema,
      oracle,
      testSuite,
      difficulty: config.difficulty,
    });

    return {
      parameters,
      generatedInput,
      expectedOutput,
      publicTests: testSuite.publicTests,
      hiddenTests: testSuite.hiddenTests,
      stressTests: testSuite.stressTests,
      boundaryTests: testSuite.boundaryTests,
      validation,
    };
  }
}
