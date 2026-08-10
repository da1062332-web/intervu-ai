import { PatternExecutionService } from "../pattern-execution.service";
import { OracleRegistry } from "../../oracles/oracle.registry";
import { ArrayRotationOracle } from "../../oracles/array-rotation.oracle";
import { PalindromeOracle } from "../../oracles/palindrome.oracle";
import { SeededParameterGeneratorService } from "../../generators/seeded-parameter-generator.service";
import { TestSuiteGeneratorService } from "../../generators/test-suite-generator.service";
import { PatternValidatorService } from "../../validators/pattern-validator.service";
import { ParameterValidator } from "../../validators/parameter-validator";
import { ConstraintValidator } from "../../validators/constraint-validator";
import { OracleValidator } from "../../validators/oracle-validator";
import { TestCaseValidator } from "../../validators/test-case-validator";
import { DifficultyValidator } from "../../validators/difficulty-validator";

describe("PatternExecutionService", () => {
  let executionService: PatternExecutionService;

  beforeEach(() => {
    const arrayRotationOracle = new ArrayRotationOracle();
    const palindromeOracle = new PalindromeOracle();
    const oracleRegistry = new OracleRegistry([arrayRotationOracle, palindromeOracle]);
    const paramGenerator = new SeededParameterGeneratorService();
    const testSuiteGenerator = new TestSuiteGeneratorService();

    const validatorService = new PatternValidatorService(
      new ParameterValidator(),
      new ConstraintValidator(),
      new OracleValidator(),
      new TestCaseValidator(),
      new DifficultyValidator(),
    );

    const mockOracleService: any = {
      validateOracleForUsage: jest.fn().mockResolvedValue(undefined),
    };

    executionService = new PatternExecutionService(
      oracleRegistry,
      paramGenerator,
      testSuiteGenerator,
      validatorService,
      mockOracleService,
    );
  });

  it("should execute pattern for ARRAY_ROTATION_ORACLE cleanly", async () => {
    const result = await executionService.executePattern(
      {
        oracleKey: "ARRAY_ROTATION_ORACLE",
        parameterSchema: { arraySize: { type: "integer", min: 3, max: 10 }, k: { type: "integer", min: 1, max: 5 } },
        constraintSchema: {},
      },
      42,
    );

    expect(result).toBeDefined();
    expect(result.parameters).toBeDefined();
    expect(result.generatedInput).toBeDefined();
    expect(result.expectedOutput).toBeDefined();
    expect(result.publicTests.length).toBeGreaterThan(0);
    expect(result.hiddenTests.length).toBeGreaterThan(0);
    expect(result.stressTests.length).toBeGreaterThan(0);
    expect(result.boundaryTests.length).toBeGreaterThan(0);
    expect(result.validation.valid).toBe(true);
  });

  it("should execute pattern for PALINDROME_ORACLE cleanly", async () => {
    const result = await executionService.executePattern(
      {
        oracleKey: "PALINDROME_ORACLE",
        parameterSchema: { word: { type: "string" } },
        constraintSchema: {},
      },
      42,
    );

    expect(result).toBeDefined();
    expect(result.parameters).toBeDefined();
    expect(result.validation.valid).toBe(true);
  });
});
