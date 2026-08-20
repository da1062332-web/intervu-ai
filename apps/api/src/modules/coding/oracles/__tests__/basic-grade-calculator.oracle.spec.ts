import { Test, TestingModule } from "@nestjs/testing";
import { BasicGradeCalculatorOracle } from "../basic-grade-calculator.oracle";
import { OracleRegistry } from "../oracle.registry";
import { ORACLE_PROVIDERS_TOKEN } from "../oracle.constants";
import { CodingModule } from "../../coding.module";

describe("BasicGradeCalculatorOracle", () => {
  let oracle: BasicGradeCalculatorOracle;
  let registry: OracleRegistry;

  beforeEach(async () => {
    oracle = new BasicGradeCalculatorOracle();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ORACLE_PROVIDERS_TOKEN,
          useValue: [oracle],
        },
        OracleRegistry,
      ],
    }).compile();

    registry = moduleRef.get<OracleRegistry>(OracleRegistry);
  });

  describe("Metadata & Discovery", () => {
    it("should be registered in OracleRegistry via CodingModule", () => {
      expect(registry.hasOracle("BASIC_GRADE_CALCULATOR_ORACLE")).toBe(true);
      const meta = registry.getMetadataByKey("BASIC_GRADE_CALCULATOR_ORACLE");
      expect(meta.key).toBe("BASIC_GRADE_CALCULATOR_ORACLE");
      expect(meta.name).toBe("Basic Grade Calculator");
      expect(meta.category).toBe("BASIC");
      expect(meta.description).toBe(
        "Calculates a student's grade from marks using configurable grading thresholds.",
      );
      expect(meta.supportedDifficulties).toEqual(["EASY"]);
    });

    it("should provide valid parameterSchema with defaults", () => {
      const schema = oracle.parameterSchema;
      expect(schema).toBeDefined();
      expect(schema.marks.default).toBe(85);
      expect(schema.aThreshold.default).toBe(90);
      expect(schema.bThreshold.default).toBe(80);
      expect(schema.cThreshold.default).toBe(70);
      expect(schema.dThreshold.default).toBe(60);
    });
  });

  describe("generateInput & generateExpectedOutput", () => {
    it("should generate input correctly using default parameters", () => {
      const input = oracle.generateInput({ marks: 85 });
      expect(input).toEqual({
        marks: 85,
        thresholds: { A: 90, B: 80, C: 70, D: 60 },
      });
    });

    it("should generate input correctly with custom parameters", () => {
      const input = oracle.generateInput({
        marks: 75,
        aThreshold: 95,
        bThreshold: 85,
        cThreshold: 75,
        dThreshold: 65,
      });
      expect(input).toEqual({
        marks: 75,
        thresholds: { A: 95, B: 85, C: 75, D: 65 },
      });
    });
  });

  describe("Boundary Condition Tests (0, 59, 60, 69, 70, 79, 80, 89, 90, 100)", () => {
    const boundaryCases = [
      { marks: 0, expectedGrade: "F" },
      { marks: 59, expectedGrade: "F" },
      { marks: 60, expectedGrade: "D" },
      { marks: 69, expectedGrade: "D" },
      { marks: 70, expectedGrade: "C" },
      { marks: 79, expectedGrade: "C" },
      { marks: 80, expectedGrade: "B" },
      { marks: 89, expectedGrade: "B" },
      { marks: 90, expectedGrade: "A" },
      { marks: 100, expectedGrade: "A" },
    ];

    boundaryCases.forEach(({ marks, expectedGrade }) => {
      it(`should return grade '${expectedGrade}' for boundary marks = ${marks}`, () => {
        const input = oracle.generateInput({ marks });
        const output = oracle.generateExpectedOutput(input);
        expect(output.grade).toBe(expectedGrade);
        expect(output.result).toBe(expectedGrade);

        // Verify output structure validation
        const outputErrors = oracle.validateOutput(input, output);
        expect(outputErrors).toHaveLength(0);
      });
    });
  });

  describe("Configurable Grade Thresholds", () => {
    it("should compute correct grades when custom thresholds are provided", () => {
      const customThresholds = { A: 95, B: 85, C: 75, D: 65 };

      expect(
        oracle.generateExpectedOutput({ marks: 96, thresholds: customThresholds }).grade,
      ).toBe("A");
      expect(
        oracle.generateExpectedOutput({ marks: 94, thresholds: customThresholds }).grade,
      ).toBe("B");
      expect(
        oracle.generateExpectedOutput({ marks: 85, thresholds: customThresholds }).grade,
      ).toBe("B");
      expect(
        oracle.generateExpectedOutput({ marks: 75, thresholds: customThresholds }).grade,
      ).toBe("C");
      expect(
        oracle.generateExpectedOutput({ marks: 65, thresholds: customThresholds }).grade,
      ).toBe("D");
      expect(
        oracle.generateExpectedOutput({ marks: 64, thresholds: customThresholds }).grade,
      ).toBe("F");
    });
  });

  describe("Validation of Invalid Marks & Contract Compliance", () => {
    it("should pass input validation for valid marks (0..100)", () => {
      expect(oracle.validateInput({ marks: 0 })).toHaveLength(0);
      expect(oracle.validateInput({ marks: 50 })).toHaveLength(0);
      expect(oracle.validateInput({ marks: 100 })).toHaveLength(0);
    });

    it("should fail validation for missing marks property", () => {
      const errors = oracle.validateInput({});
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toMatch(/Input property 'marks' is required/i);
    });

    it("should fail validation for null or undefined marks", () => {
      expect(oracle.validateInput({ marks: null }).length).toBeGreaterThan(0);
      expect(oracle.validateInput({ marks: undefined }).length).toBeGreaterThan(0);
    });

    it("should fail validation for non-numeric marks", () => {
      expect(oracle.validateInput({ marks: "eighty" }).length).toBeGreaterThan(0);
      expect(oracle.validateInput({ marks: NaN }).length).toBeGreaterThan(0);
    });

    it("should fail validation for marks < 0", () => {
      const errors = oracle.validateInput({ marks: -1 });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toMatch(/must be between 0 and 100 inclusive/i);
    });

    it("should fail validation for marks > 100", () => {
      const errors = oracle.validateInput({ marks: 101 });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toMatch(/must be between 0 and 100 inclusive/i);
    });

    it("should fail validation for invalid threshold ordering", () => {
      const invalidThresholds = {
        thresholds: { A: 70, B: 80, C: 90, D: 60 },
      };
      const errors = oracle.validateInput({ marks: 85, ...invalidThresholds });
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toMatch(/Thresholds must strictly satisfy/i);
    });
  });
});
