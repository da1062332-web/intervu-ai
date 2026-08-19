import * as StandardOracles from "../standard-oracles";

describe("TCS Advanced Coding Catalog - LOOP Category Unit & Boundary Tests", () => {
  describe("1. LOOP_STAR_PATTERN_ORACLE", () => {
    let oracle: StandardOracles.LoopStarPatternOracle;

    beforeEach(() => {
      oracle = new StandardOracles.LoopStarPatternOracle();
    });

    it("metadata check", () => {
      expect(oracle.key).toBe("LOOP_STAR_PATTERN_ORACLE");
      expect(oracle.category).toBe("LOOP");
      expect(oracle.supportedDifficulties).toEqual(["EASY"]);
    });

    it("N=1 boundary: generates a single star", () => {
      const output = oracle.generateExpectedOutput({ n: 1 });
      expect(output.pattern).toBe("*");
      expect(output.lines).toEqual(["*"]);
      expect(output.result).toBe("*");
    });

    it("N=5 default: generates left-aligned 5-row star pattern", () => {
      const output = oracle.generateExpectedOutput({ n: 5 });
      const expectedLines = ["*", "**", "***", "****", "*****"];
      expect(output.lines).toEqual(expectedLines);
      expect(output.pattern).toBe(expectedLines.join("\n"));
      expect(output.rowCount).toBe(5);
    });

    it("N=30 maximum boundary: generates 30 rows deterministically", () => {
      const output = oracle.generateExpectedOutput({ n: 30 });
      expect(output.lines.length).toBe(30);
      expect(output.lines[29]).toBe("*".repeat(30));
    });

    it("validates input constraints properly", () => {
      expect(oracle.validateInput({ n: 5 })).toEqual([]);
      expect(oracle.validateInput({ n: 0 })).toContain("Input property 'n' must be between 1 and 30.");
      expect(oracle.validateInput({ n: 31 })).toContain("Input property 'n' must be between 1 and 30.");
      expect(oracle.validateInput({ n: 3.5 })).toContain("Input property 'n' must be an integer.");
      expect(oracle.validateInput({ n: "5" as any })).toContain("Input property 'n' must be an integer.");
    });
  });

  describe("2. LOOP_NUMBER_PATTERN_ORACLE", () => {
    let oracle: StandardOracles.LoopNumberPatternOracle;

    beforeEach(() => {
      oracle = new StandardOracles.LoopNumberPatternOracle();
    });

    it("metadata check", () => {
      expect(oracle.key).toBe("LOOP_NUMBER_PATTERN_ORACLE");
      expect(oracle.category).toBe("LOOP");
    });

    it("N=1 boundary: generates 1", () => {
      const output = oracle.generateExpectedOutput({ n: 1 });
      expect(output.pattern).toBe("1");
      expect(output.lines).toEqual(["1"]);
      expect(output.totalNumbers).toBe(1);
    });

    it("N=4 example: generates sequential numbers across rows", () => {
      const output = oracle.generateExpectedOutput({ n: 4 });
      const expectedLines = [
        "1",
        "2 3",
        "4 5 6",
        "7 8 9 10",
      ];
      expect(output.lines).toEqual(expectedLines);
      expect(output.pattern).toBe(expectedLines.join("\n"));
      expect(output.totalNumbers).toBe(10);
    });

    it("N=20 maximum supported boundary: generates 20 rows with total 210 numbers", () => {
      const output = oracle.generateExpectedOutput({ n: 20 });
      expect(output.lines.length).toBe(20);
      expect(output.totalNumbers).toBe(210); // (20 * 21) / 2
    });

    it("validates input constraints properly", () => {
      expect(oracle.validateInput({ n: 4 })).toEqual([]);
      expect(oracle.validateInput({ n: 0 })).toContain("Input property 'n' must be between 1 and 20.");
      expect(oracle.validateInput({ n: 21 })).toContain("Input property 'n' must be between 1 and 20.");
      expect(oracle.validateInput({ n: "invalid" as any })).toContain("Input property 'n' must be an integer.");
    });
  });

  describe("3. LOOP_PYRAMID_PATTERN_ORACLE", () => {
    let oracle: StandardOracles.LoopPyramidPatternOracle;

    beforeEach(() => {
      oracle = new StandardOracles.LoopPyramidPatternOracle();
    });

    it("metadata check", () => {
      expect(oracle.key).toBe("LOOP_PYRAMID_PATTERN_ORACLE");
      expect(oracle.category).toBe("LOOP");
    });

    it("N=1 boundary: single centered star without spaces", () => {
      const output = oracle.generateExpectedOutput({ n: 1 });
      expect(output.pattern).toBe("*");
      expect(output.lines).toEqual(["*"]);
    });

    it("N=4 example: generates exact leading spaces and 2*i-1 stars with no trailing spaces", () => {
      const output = oracle.generateExpectedOutput({ n: 4 });
      const expectedLines = [
        "   *",
        "  ***",
        " *****",
        "*******",
      ];
      expect(output.lines).toEqual(expectedLines);
      expect(output.pattern).toBe(expectedLines.join("\n"));
    });

    it("N=20 maximum supported boundary: generates 20 pyramid rows", () => {
      const output = oracle.generateExpectedOutput({ n: 20 });
      expect(output.lines.length).toBe(20);
      expect(output.lines[0]).toBe(" ".repeat(19) + "*");
      expect(output.lines[19]).toBe("*".repeat(39));
    });

    it("validates input constraints properly", () => {
      expect(oracle.validateInput({ n: 4 })).toEqual([]);
      expect(oracle.validateInput({ n: 0 })).toContain("Input property 'n' must be between 1 and 20.");
      expect(oracle.validateInput({ n: 25 })).toContain("Input property 'n' must be between 1 and 20.");
    });
  });

  describe("4. LOOP_INVERTED_PATTERN_ORACLE", () => {
    let oracle: StandardOracles.LoopInvertedPatternOracle;

    beforeEach(() => {
      oracle = new StandardOracles.LoopInvertedPatternOracle();
    });

    it("metadata check", () => {
      expect(oracle.key).toBe("LOOP_INVERTED_PATTERN_ORACLE");
      expect(oracle.category).toBe("LOOP");
    });

    it("N=1 boundary: single star", () => {
      const output = oracle.generateExpectedOutput({ n: 1 });
      expect(output.pattern).toBe("*");
    });

    it("N=4 example: starts with 4 stars and decrements to 1", () => {
      const output = oracle.generateExpectedOutput({ n: 4 });
      const expectedLines = ["****", "***", "**", "*"];
      expect(output.lines).toEqual(expectedLines);
      expect(output.pattern).toBe(expectedLines.join("\n"));
    });

    it("N=30 maximum supported boundary: starts with 30 stars down to 1", () => {
      const output = oracle.generateExpectedOutput({ n: 30 });
      expect(output.lines.length).toBe(30);
      expect(output.lines[0]).toBe("*".repeat(30));
      expect(output.lines[29]).toBe("*");
    });

    it("validates input constraints properly", () => {
      expect(oracle.validateInput({ n: 4 })).toEqual([]);
      expect(oracle.validateInput({ n: 0 })).toContain("Input property 'n' must be between 1 and 30.");
      expect(oracle.validateInput({ n: 31 })).toContain("Input property 'n' must be between 1 and 30.");
    });
  });

  describe("5. LOOP_MULTIPLICATION_TABLE_ORACLE", () => {
    let oracle: StandardOracles.LoopMultiplicationTableOracle;

    beforeEach(() => {
      oracle = new StandardOracles.LoopMultiplicationTableOracle();
    });

    it("metadata check", () => {
      expect(oracle.key).toBe("LOOP_MULTIPLICATION_TABLE_ORACLE");
      expect(oracle.category).toBe("LOOP");
    });

    it("number=5, range 1..5 example: generates exact multiplication rows", () => {
      const output = oracle.generateExpectedOutput({ number: 5, start: 1, end: 5 });
      const expectedLines = [
        "5 x 1 = 5",
        "5 x 2 = 10",
        "5 x 3 = 15",
        "5 x 4 = 20",
        "5 x 5 = 25",
      ];
      expect(output.lines).toEqual(expectedLines);
      expect(output.table).toBe(expectedLines.join("\n"));
    });

    it("handles negative numbers properly", () => {
      const output = oracle.generateExpectedOutput({ number: -7, start: 1, end: 3 });
      expect(output.lines).toEqual([
        "-7 x 1 = -7",
        "-7 x 2 = -14",
        "-7 x 3 = -21",
      ]);
    });

    it("handles start=end boundary", () => {
      const output = oracle.generateExpectedOutput({ number: 12, start: 6, end: 6 });
      expect(output.lines).toEqual(["12 x 6 = 72"]);
    });

    it("validates input constraints properly", () => {
      expect(oracle.validateInput({ number: 5, start: 1, end: 10 })).toEqual([]);
      expect(oracle.validateInput({ number: -1001, start: 1, end: 10 })).toContain("Input property 'number' must be between -1000 and 1000.");
      expect(oracle.validateInput({ number: 5, start: 0, end: 10 })).toContain("Input property 'start' must be between 1 and 100.");
      expect(oracle.validateInput({ number: 5, start: 1, end: 101 })).toContain("Input property 'end' must be between 1 and 100.");
      expect(oracle.validateInput({ number: 5, start: 10, end: 5 })).toContain("Input property 'start' must be less than or equal to 'end'.");
    });
  });

  describe("6. LOOP_RANGE_SUM_ORACLE", () => {
    let oracle: StandardOracles.LoopRangeSumOracle;

    beforeEach(() => {
      oracle = new StandardOracles.LoopRangeSumOracle();
    });

    it("metadata check", () => {
      expect(oracle.key).toBe("LOOP_RANGE_SUM_ORACLE");
      expect(oracle.category).toBe("LOOP");
    });

    it("1..5 -> 15 example test", () => {
      const output = oracle.generateExpectedOutput({ start: 1, end: 5 });
      expect(output.sum).toBe(15);
      expect(output.result).toBe(15);
    });

    it("start=end boundary: returns single value", () => {
      const output = oracle.generateExpectedOutput({ start: 42, end: 42 });
      expect(output.sum).toBe(42);
    });

    it("negative range test: -10 to 10 -> 0", () => {
      const output = oracle.generateExpectedOutput({ start: -10, end: 10 });
      expect(output.sum).toBe(0);
    });

    it("large valid range test: 1 to 100000 -> 5000050000", () => {
      const output = oracle.generateExpectedOutput({ start: 1, end: 100000 });
      expect(output.sum).toBe(5000050000);
    });

    it("validates input constraints properly", () => {
      expect(oracle.validateInput({ start: 1, end: 10 })).toEqual([]);
      expect(oracle.validateInput({ start: -100001, end: 10 })).toContain("Input property 'start' must be between -100000 and 100000.");
      expect(oracle.validateInput({ start: 10, end: 5 })).toContain("Input property 'start' must be less than or equal to 'end'.");
    });
  });
});
