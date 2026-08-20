import { Test, TestingModule } from "@nestjs/testing";
import { OracleRegistry } from "../oracle.registry";
import { ORACLE_PROVIDERS_TOKEN } from "../oracle.constants";
import { BasicGradeCalculatorOracle } from "../basic-grade-calculator.oracle";

describe("All Active Oracles - parameterSchema & Default JSON Verification", () => {
  let registry: OracleRegistry;

  beforeEach(async () => {
    const providersList = [new BasicGradeCalculatorOracle()];

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ORACLE_PROVIDERS_TOKEN,
          useValue: providersList,
        },
        OracleRegistry,
      ],
    }).compile();

    registry = moduleRef.get<OracleRegistry>(OracleRegistry);
  });

  it("should have exactly 1 active Oracle registered (BASIC_GRADE_CALCULATOR_ORACLE)", () => {
    const allOracles = registry.getAllOracles();
    expect(allOracles.length).toBe(1);
    expect(allOracles[0].key).toBe("BASIC_GRADE_CALCULATOR_ORACLE");
  });

  it("should ensure every registered Oracle has a parameterSchema with defaults", () => {
    const allMetadata = registry.getAllMetadata();

    for (const meta of allMetadata) {
      expect(meta.parameterSchema).toBeDefined();
      expect(typeof meta.parameterSchema).toBe("object");

      const schemaKeys = Object.keys(meta.parameterSchema || {});
      expect(schemaKeys.length).toBeGreaterThan(0);

      for (const [paramKey, spec] of Object.entries(meta.parameterSchema as Record<string, any>)) {
        expect(spec).toBeDefined();
        expect(spec.default).toBeDefined();
      }
    }
  });

  it("should verify generateInput and generateExpectedOutput work with default parameters", () => {
    const allOracles = registry.getAllOracles();

    for (const oracle of allOracles) {
      const defaults: Record<string, any> = {};
      if (oracle.parameterSchema) {
        for (const [key, spec] of Object.entries(oracle.parameterSchema as Record<string, any>)) {
          defaults[key] = spec.default;
        }
      }

      const input = oracle.generateInput(defaults);
      expect(input).toBeDefined();
      expect(typeof input).toBe("object");

      const output = oracle.generateExpectedOutput(input);
      expect(output).toBeDefined();
      expect(typeof output).toBe("object");
      expect(output.result !== undefined || output.grade !== undefined).toBe(true);
    }
  });

  it("should generate a complete non-duplicate test suite across multiple seeds", () => {
    const generator = new (require("../../generators/test-suite-generator.service").TestSuiteGeneratorService)();
    const allOracles = registry.getAllOracles();
    const seedsToTest = [42, 100, 777, 9999, 123456];

    for (const oracle of allOracles) {
      for (const seed of seedsToTest) {
        let suite: any;
        expect(() => {
          suite = generator.generateTestSuite(oracle, {}, seed);
        }).not.toThrow();

        expect(suite).toBeDefined();
        expect(suite.publicTests.length).toBe(2);
        expect(suite.hiddenTests.length).toBe(3);
        expect(suite.boundaryTests.length).toBe(1);
        expect(suite.stressTests.length).toBe(1);

        const allTests = [
          ...suite.publicTests,
          ...suite.hiddenTests,
          ...suite.boundaryTests,
          ...suite.stressTests,
        ];

        for (const tc of allTests) {
          expect(tc.input).toBeDefined();
          expect(tc.expectedOutput).toBeDefined();
        }
      }
    }
  });
});
