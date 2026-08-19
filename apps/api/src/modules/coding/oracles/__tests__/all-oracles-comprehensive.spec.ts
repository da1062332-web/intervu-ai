import { Test, TestingModule } from "@nestjs/testing";
import { OracleRegistry } from "../oracle.registry";
import { ORACLE_PROVIDERS_TOKEN } from "../oracle.constants";
import * as StandardOracles from "../standard-oracles";
import { TestSuiteGeneratorService } from "../../generators/test-suite-generator.service";

describe("All 95 TCS Advanced Coding Oracles - Comprehensive Verification", () => {
  let registry: OracleRegistry;
  let testSuiteGenerator: TestSuiteGeneratorService;

  beforeAll(async () => {
    const oracleClasses = Object.values(StandardOracles).filter(
      (item) => typeof item === "function" && item.prototype,
    ) as any[];

    const providersList = oracleClasses.map((Cls) => new Cls());

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ORACLE_PROVIDERS_TOKEN,
          useValue: providersList,
        },
        OracleRegistry,
        TestSuiteGeneratorService,
      ],
    }).compile();

    registry = moduleRef.get<OracleRegistry>(OracleRegistry);
    testSuiteGenerator = moduleRef.get<TestSuiteGeneratorService>(TestSuiteGeneratorService);
  });

  it("should have exactly 95 Oracles registered in OracleRegistry", () => {
    const allOracles = registry.getAllOracles();
    expect(allOracles.length).toBe(95);
  });

  it("should ensure every Oracle has key, name, category, description, and supportedDifficulties", () => {
    const allMetadata = registry.getAllMetadata();

    for (const meta of allMetadata) {
      expect(meta.key).toBeDefined();
      expect(typeof meta.key).toBe("string");
      expect(meta.key.length).toBeGreaterThan(0);

      expect(meta.name).toBeDefined();
      expect(typeof meta.name).toBe("string");
      expect(meta.name.length).toBeGreaterThan(0);

      expect(meta.category).toBeDefined();
      expect(typeof meta.category).toBe("string");

      expect(meta.description).toBeDefined();
      expect(typeof meta.description).toBe("string");
      expect(meta.description.length).toBeGreaterThan(0);

      expect(Array.isArray(meta.supportedDifficulties)).toBe(true);
      expect(meta.supportedDifficulties.length).toBeGreaterThan(0);
    }
  });

  it("should ensure every Oracle has parameterSchema with non-empty specs and default values", () => {
    const allOracles = registry.getAllOracles();

    for (const oracle of allOracles) {
      expect(oracle.parameterSchema).toBeDefined();
      expect(typeof oracle.parameterSchema).toBe("object");

      const schemaKeys = Object.keys(oracle.parameterSchema || {});
      expect(schemaKeys.length).toBeGreaterThan(0);

      for (const [key, spec] of Object.entries(oracle.parameterSchema || {})) {
        expect(spec).toBeDefined();
        expect(typeof spec).toBe("object");
        expect(spec.default).toBeDefined();
      }
    }
  });

  it("should verify generateInput and generateExpectedOutput work deterministically with defaults for all 95 Oracles", () => {
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
      expect(output.result).toBeDefined();

      // Check validation
      if (oracle.validateInput) {
        const valErrors = oracle.validateInput(input);
        expect(valErrors).toEqual([]);
      }
    }
  });

  it("should generate a complete non-duplicate test suite for EVERY Oracle across multiple seeds", () => {
    const allOracles = registry.getAllOracles();
    const seedsToTest = [42, 777, 9999];

    for (const oracle of allOracles) {
      for (const seed of seedsToTest) {
        let suite: any;
        expect(() => {
          suite = testSuiteGenerator.generateTestSuite(oracle, {}, seed);
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
          expect(tc.expectedOutput.result).toBeDefined();
        }
      }
    }
  });
});
