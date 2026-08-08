import { TestSuiteGeneratorService } from "../test-suite-generator.service";
import { MathPrimeCheckOracle } from "../../oracles/standard-oracles";
import { ArrayRotationOracle } from "../../oracles/array-rotation.oracle";
import { PalindromeOracle } from "../../oracles/palindrome.oracle";

describe("TestSuiteGeneratorService", () => {
  let generator: TestSuiteGeneratorService;
  let primeOracle: MathPrimeCheckOracle;
  let rotationOracle: ArrayRotationOracle;
  let palindromeOracle: PalindromeOracle;

  beforeEach(() => {
    generator = new TestSuiteGeneratorService();
    primeOracle = new MathPrimeCheckOracle();
    rotationOracle = new ArrayRotationOracle();
    palindromeOracle = new PalindromeOracle();
  });

  describe("MATH_PRIME_CHECK_ORACLE", () => {
    it("should generate non-duplicate test cases with correct expected outputs", () => {
      const suite = generator.generateTestSuite(primeOracle, { n: 29 }, 42);

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
        const expected = primeOracle.generateExpectedOutput(inp);
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
      const suite = generator.generateTestSuite(primeOracle, { n: 29 }, 42);

      expect(suite.boundaryTests.length).toBeGreaterThan(0);
      expect(suite.stressTests.length).toBeGreaterThan(0);

      // Boundary input for prime check should be small (n <= 2)
      expect(suite.boundaryTests[0].input.n).toBeLessThanOrEqual(2);

      // Stress input should be large (n >= 1000)
      expect(suite.stressTests[0].input.n).toBeGreaterThanOrEqual(1000);
    });

    it("should produce deterministic test suites for same seed and different suites for different seeds", () => {
      const suite1 = generator.generateTestSuite(primeOracle, { n: 29 }, 42);
      const suite2 = generator.generateTestSuite(primeOracle, { n: 29 }, 42);
      const suite3 = generator.generateTestSuite(primeOracle, { n: 29 }, 999);

      expect(suite1).toEqual(suite2);
      expect(suite1).not.toEqual(suite3);
    });
  });

  describe("ARRAY_ROTATION_ORACLE", () => {
    it("should generate valid non-duplicate test cases for array rotation", () => {
      const suite = generator.generateTestSuite(
        rotationOracle,
        { arraySize: 5, k: 2 },
        42,
      );

      const allInputs = [
        ...suite.publicTests.map((t) => t.input),
        ...suite.hiddenTests.map((t) => t.input),
        ...suite.boundaryTests.map((t) => t.input),
        ...suite.stressTests.map((t) => t.input),
      ];

      const inputHashes = allInputs.map((inp) => JSON.stringify(inp));
      const uniqueHashes = new Set(inputHashes);

      expect(uniqueHashes.size).toBe(allInputs.length);

      // Verify solve outputs
      allInputs.forEach((inp) => {
        const expected = rotationOracle.generateExpectedOutput(inp);
        const matchedTest = [
          ...suite.publicTests,
          ...suite.hiddenTests,
          ...suite.boundaryTests,
          ...suite.stressTests,
        ].find((t) => JSON.stringify(t.input) === JSON.stringify(inp));

        expect(matchedTest?.expectedOutput).toEqual(expected);
      });
    });
  });

  describe("PALINDROME_ORACLE", () => {
    it("should generate valid non-duplicate test cases for palindrome oracle", () => {
      const suite = generator.generateTestSuite(
        palindromeOracle,
        { word: "racecar" },
        42,
      );

      const allInputs = [
        ...suite.publicTests.map((t) => t.input),
        ...suite.hiddenTests.map((t) => t.input),
        ...suite.boundaryTests.map((t) => t.input),
        ...suite.stressTests.map((t) => t.input),
      ];

      const inputHashes = allInputs.map((inp) => JSON.stringify(inp));
      const uniqueHashes = new Set(inputHashes);

      expect(uniqueHashes.size).toBe(allInputs.length);
    });
  });
});
