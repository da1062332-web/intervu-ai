import { Injectable } from "@nestjs/common";
import { BaseOracle } from "./base.oracle";

/**
 * 1. LOOP_STAR_PATTERN_ORACLE
 */
@Injectable()
export class LoopStarPatternOracle extends BaseOracle {
  readonly key = "LOOP_STAR_PATTERN_ORACLE";
  readonly name = "Left-Aligned Star Pattern";
  readonly category = "LOOP";
  readonly description = "Generates a left-aligned star pattern with N rows.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    n: { type: "integer", min: 1, max: 30, default: 5 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? Math.max(1, Math.min(30, parameters.n)) : 5;
    return { n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const n = typeof input.n === "number" ? Math.max(1, Math.min(30, input.n)) : 1;
    const lines: string[] = [];

    for (let i = 1; i <= n; i++) {
      lines.push("*".repeat(i));
    }

    const pattern = lines.join("\n");

    return {
      pattern,
      lines,
      rowCount: n,
      result: pattern,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.n !== "number" || !Number.isInteger(input.n)) {
      errors.push("Input property 'n' must be an integer.");
    } else if (input.n < 1 || input.n > 30) {
      errors.push("Input property 'n' must be between 1 and 30.");
    }
    return errors;
  }
}

/**
 * 2. LOOP_NUMBER_PATTERN_ORACLE
 */
@Injectable()
export class LoopNumberPatternOracle extends BaseOracle {
  readonly key = "LOOP_NUMBER_PATTERN_ORACLE";
  readonly name = "Sequential Number Triangle";
  readonly category = "LOOP";
  readonly description = "Generates a sequential number pattern using nested loop traversal.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    n: { type: "integer", min: 1, max: 20, default: 4 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? Math.max(1, Math.min(20, parameters.n)) : 4;
    return { n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const n = typeof input.n === "number" ? Math.max(1, Math.min(20, input.n)) : 1;
    const lines: string[] = [];
    let currentNumber = 1;

    for (let i = 1; i <= n; i++) {
      const rowNumbers: number[] = [];
      for (let j = 0; j < i; j++) {
        rowNumbers.push(currentNumber++);
      }
      lines.push(rowNumbers.join(" "));
    }

    const pattern = lines.join("\n");

    return {
      pattern,
      lines,
      rowCount: n,
      totalNumbers: currentNumber - 1,
      result: pattern,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.n !== "number" || !Number.isInteger(input.n)) {
      errors.push("Input property 'n' must be an integer.");
    } else if (input.n < 1 || input.n > 20) {
      errors.push("Input property 'n' must be between 1 and 20.");
    }
    return errors;
  }
}

/**
 * 3. LOOP_PYRAMID_PATTERN_ORACLE
 */
@Injectable()
export class LoopPyramidPatternOracle extends BaseOracle {
  readonly key = "LOOP_PYRAMID_PATTERN_ORACLE";
  readonly name = "Centered Star Pyramid";
  readonly category = "LOOP";
  readonly description = "Generates a centered star pyramid containing N rows.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    n: { type: "integer", min: 1, max: 20, default: 4 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? Math.max(1, Math.min(20, parameters.n)) : 4;
    return { n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const n = typeof input.n === "number" ? Math.max(1, Math.min(20, input.n)) : 1;
    const lines: string[] = [];

    for (let i = 1; i <= n; i++) {
      const leadingSpaces = " ".repeat(n - i);
      const stars = "*".repeat(2 * i - 1);
      lines.push(`${leadingSpaces}${stars}`);
    }

    const pattern = lines.join("\n");

    return {
      pattern,
      lines,
      rowCount: n,
      result: pattern,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.n !== "number" || !Number.isInteger(input.n)) {
      errors.push("Input property 'n' must be an integer.");
    } else if (input.n < 1 || input.n > 20) {
      errors.push("Input property 'n' must be between 1 and 20.");
    }
    return errors;
  }
}

/**
 * 4. LOOP_INVERTED_PATTERN_ORACLE
 */
@Injectable()
export class LoopInvertedPatternOracle extends BaseOracle {
  readonly key = "LOOP_INVERTED_PATTERN_ORACLE";
  readonly name = "Inverted Star Pattern";
  readonly category = "LOOP";
  readonly description = "Generates an inverted star pattern with N rows.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    n: { type: "integer", min: 1, max: 30, default: 4 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? Math.max(1, Math.min(30, parameters.n)) : 4;
    return { n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const n = typeof input.n === "number" ? Math.max(1, Math.min(30, input.n)) : 1;
    const lines: string[] = [];

    for (let i = n; i >= 1; i--) {
      lines.push("*".repeat(i));
    }

    const pattern = lines.join("\n");

    return {
      pattern,
      lines,
      rowCount: n,
      result: pattern,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.n !== "number" || !Number.isInteger(input.n)) {
      errors.push("Input property 'n' must be an integer.");
    } else if (input.n < 1 || input.n > 30) {
      errors.push("Input property 'n' must be between 1 and 30.");
    }
    return errors;
  }
}

/**
 * 5. LOOP_MULTIPLICATION_TABLE_ORACLE
 */
@Injectable()
export class LoopMultiplicationTableOracle extends BaseOracle {
  readonly key = "LOOP_MULTIPLICATION_TABLE_ORACLE";
  readonly name = "Multiplication Table Generator";
  readonly category = "LOOP";
  readonly description = "Generates the multiplication table for a given number over a configurable range.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    number: { type: "integer", min: -1000, max: 1000, default: 5 },
    start: { type: "integer", min: 1, max: 100, default: 1 },
    end: { type: "integer", min: 1, max: 100, default: 10 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const num = typeof parameters.number === "number" ? Math.max(-1000, Math.min(1000, parameters.number)) : 5;
    let start = typeof parameters.start === "number" ? Math.max(1, Math.min(100, parameters.start)) : 1;
    let end = typeof parameters.end === "number" ? Math.max(1, Math.min(100, parameters.end)) : 10;
    if (start > end) {
      [start, end] = [end, start];
    }
    return { number: num, start, end };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const num = typeof input.number === "number" ? input.number : 5;
    const start = typeof input.start === "number" ? input.start : 1;
    const end = typeof input.end === "number" ? input.end : 10;

    const lines: string[] = [];
    for (let m = start; m <= end; m++) {
      lines.push(`${num} x ${m} = ${num * m}`);
    }

    const table = lines.join("\n");

    return {
      table,
      lines,
      number: num,
      start,
      end,
      result: table,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.number !== "number" || !Number.isInteger(input.number)) {
      errors.push("Input property 'number' must be an integer.");
    } else if (input.number < -1000 || input.number > 1000) {
      errors.push("Input property 'number' must be between -1000 and 1000.");
    }

    if (typeof input.start !== "number" || !Number.isInteger(input.start)) {
      errors.push("Input property 'start' must be an integer.");
    } else if (input.start < 1 || input.start > 100) {
      errors.push("Input property 'start' must be between 1 and 100.");
    }

    if (typeof input.end !== "number" || !Number.isInteger(input.end)) {
      errors.push("Input property 'end' must be an integer.");
    } else if (input.end < 1 || input.end > 100) {
      errors.push("Input property 'end' must be between 1 and 100.");
    }

    if (
      typeof input.start === "number" &&
      typeof input.end === "number" &&
      input.start > input.end
    ) {
      errors.push("Input property 'start' must be less than or equal to 'end'.");
    }

    return errors;
  }
}

/**
 * 6. LOOP_RANGE_SUM_ORACLE
 */
@Injectable()
export class LoopRangeSumOracle extends BaseOracle {
  readonly key = "LOOP_RANGE_SUM_ORACLE";
  readonly name = "Inclusive Range Sum";
  readonly category = "LOOP";
  readonly description = "Calculates the sum of all integers within an inclusive range.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    start: { type: "integer", min: -100000, max: 100000, default: 1 },
    end: { type: "integer", min: -100000, max: 100000, default: 5 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    let start = typeof parameters.start === "number" ? Math.max(-100000, Math.min(100000, parameters.start)) : 1;
    let end = typeof parameters.end === "number" ? Math.max(-100000, Math.min(100000, parameters.end)) : 5;
    if (start > end) {
      [start, end] = [end, start];
    }
    return { start, end };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const start = typeof input.start === "number" ? input.start : 1;
    const end = typeof input.end === "number" ? input.end : 5;

    // Use loop computation or closed form safely
    let sum = 0;
    // For large range, arithmetic series formula is safe and O(1)
    const count = end - start + 1;
    sum = (count * (start + end)) / 2;

    return {
      start,
      end,
      count,
      sum,
      result: sum,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.start !== "number" || !Number.isInteger(input.start)) {
      errors.push("Input property 'start' must be an integer.");
    } else if (input.start < -100000 || input.start > 100000) {
      errors.push("Input property 'start' must be between -100000 and 100000.");
    }

    if (typeof input.end !== "number" || !Number.isInteger(input.end)) {
      errors.push("Input property 'end' must be an integer.");
    } else if (input.end < -100000 || input.end > 100000) {
      errors.push("Input property 'end' must be between -100000 and 100000.");
    }

    if (
      typeof input.start === "number" &&
      typeof input.end === "number" &&
      input.start > input.end
    ) {
      errors.push("Input property 'start' must be less than or equal to 'end'.");
    }

    return errors;
  }
}
