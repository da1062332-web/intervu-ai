import { Test, TestingModule } from "@nestjs/testing";
import { CodingModule } from "../../coding.module";
import { OracleRegistry } from "../oracle.registry";

describe("All Standard Oracles - parameterSchema & Default JSON Verification", () => {
  let registry: OracleRegistry;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [CodingModule],
    }).compile();

    registry = moduleRef.get<OracleRegistry>(OracleRegistry);
  });

  it("should have all 30 standard Oracles registered", () => {
    const allOracles = registry.getAllOracles();
    expect(allOracles.length).toBeGreaterThanOrEqual(30);
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

  it("should verify generateInput and generateExpectedOutput work for every Oracle with default parameters", () => {
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
      expect(output.result !== undefined || output.isPalindrome !== undefined).toBe(true);
    }
  });

  it("should generate a complete non-duplicate test suite for EVERY Oracle across multiple seeds without throwing duplicate input errors", () => {
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

        // Verify all 7 test cases in the suite have valid inputs & outputs
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
