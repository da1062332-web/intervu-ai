import { Injectable } from "@nestjs/common";
import { ParameterValidator } from "./parameter-validator";
import { ConstraintValidator } from "./constraint-validator";
import { OracleValidator } from "./oracle-validator";
import { TestCaseValidator } from "./test-case-validator";
import { DifficultyValidator } from "./difficulty-validator";
import { BaseOracle } from "../interfaces/oracle.interface";
import { GeneratedTestSuite } from "../generators/test-suite-generator.service";
import { DifficultyLevel } from "@prisma/client";

export interface PatternValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class PatternValidatorService {
  constructor(
    private readonly paramValidator: ParameterValidator,
    private readonly constraintValidator: ConstraintValidator,
    private readonly oracleValidator: OracleValidator,
    private readonly testCaseValidator: TestCaseValidator,
    private readonly difficultyValidator: DifficultyValidator,
  ) {}

  validateAll(params: {
    parameters: Record<string, any>;
    parameterSchema: Record<string, any>;
    input: Record<string, any>;
    output: Record<string, any>;
    constraintSchema: Record<string, any>;
    oracle: BaseOracle;
    testSuite: GeneratedTestSuite;
    difficulty?: DifficultyLevel;
  }): PatternValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Parameter Validation
    errors.push(...this.paramValidator.validate(params.parameters, params.parameterSchema));

    // 2. Constraint Validation
    errors.push(...this.constraintValidator.validate(params.input, params.constraintSchema));

    // 3. Oracle Validation
    errors.push(...this.oracleValidator.validate(params.oracle, params.input, params.output));

    // 4. Test Case Validation
    errors.push(...this.testCaseValidator.validate(params.testSuite));

    // 5. Difficulty Validation
    if (params.difficulty) {
      warnings.push(...this.difficultyValidator.validate(params.difficulty, params.parameters));
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
