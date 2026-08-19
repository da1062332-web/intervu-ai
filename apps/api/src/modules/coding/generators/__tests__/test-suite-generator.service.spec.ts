import { TestSuiteGeneratorService } from "../test-suite-generator.service";
import { BasicGradeCalculatorOracle } from "../../oracles/basic-grade-calculator.oracle";

describe("TestSuiteGeneratorService", () => {
  let generator: TestSuiteGeneratorService;
  let gradeOracle: BasicGradeCalculatorOracle;

  beforeEach(() => {
    generator = new TestSuiteGeneratorService();
    gradeOracle = new BasicGradeCalculatorOracle();
  });

  describe("BASIC_GRADE_CALCULATOR_ORACLE", () => {
    it("should generate non-duplicate test cases with correct expected outputs", () => {
      const suite = generator.generateTestSuite(gradeOracle, { score: 75 }, 42);

      const allInputs = [
        ...suite.publicTests.map((t) => t.input),
        ...suite.hiddenTests.map((t) => t.input),
        ...suite.boundaryTests.map((t) => t.input),
        ...suite.stressTests.map((t) => t.input),
      ];

      const inputHashes = allInputs.map((inp) => JSON.stringify(inp));
      const uniqueHashes = new Set(inputHashes);

      // Verify no duplicates across the full test suite
      expect(uniqueHashes.size).toBe(allInputs.length);

      // Verify expectedOutput is calculated for every specific input
      allInputs.forEach((inp) => {
        const expected = gradeOracle.generateExpectedOutput(inp);
        const matchedTest = [
          ...suite.publicTests,
          ...suite.hiddenTests,
          ...suite.boundaryTests,
          ...suite.stressTests,
        ].find((t) => JSON.stringify(t.input) === JSON.stringify(inp));

        expect(matchedTest?.expectedOutput).toEqual(expected);
      });
    });

    it("should generate boundary and stress test cases correctly", () => {
      const suite = generator.generateTestSuite(gradeOracle, { score: 75 }, 42);

      expect(suite.boundaryTests.length).toBeGreaterThan(0);
      expect(suite.stressTests.length).toBeGreaterThan(0);
    });

    it("should produce deterministic test suites for same seed and different suites for different seeds", () => {
      const suite1 = generator.generateTestSuite(gradeOracle, { score: 75 }, 42);
      const suite2 = generator.generateTestSuite(gradeOracle, { score: 75 }, 42);
      const suite3 = generator.generateTestSuite(gradeOracle, { score: 75 }, 999);

      expect(suite1).toEqual(suite2);
      expect(suite1).not.toEqual(suite3);
    });
  });
});
