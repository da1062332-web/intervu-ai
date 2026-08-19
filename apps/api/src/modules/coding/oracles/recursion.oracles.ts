import { Injectable } from "@nestjs/common";
import { BaseOracle } from "./base.oracle";

/**
 * 48. RECURSION_FACTORIAL_ORACLE
 */
@Injectable()
export class RecursionFactorialOracle extends BaseOracle {
  readonly key = "RECURSION_FACTORIAL_ORACLE";
  readonly name = "Recursive Factorial";
  readonly category = "RECURSION";
  readonly description = "Computes factorial using recursive definition.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    n: { type: "integer", min: 0, max: 12, default: 6 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? Math.max(0, Math.min(12, parameters.n)) : 6;
    return { n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const n = typeof input.n === "number" ? Math.max(0, Math.min(15, input.n)) : 0;
    const factorial = (val: number): number => (val <= 1 ? 1 : val * factorial(val - 1));
    const result = factorial(n);

    return {
      factorial: result,
      result,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.n !== "number" || input.n < 0 || input.n > 20) {
      errors.push("Input property 'n' must be an integer between 0 and 20.");
    }
    return errors;
  }
}

/**
 * 49. RECURSION_FIBONACCI_ORACLE
 */
@Injectable()
export class RecursionFibonacciOracle extends BaseOracle {
  readonly key = "RECURSION_FIBONACCI_ORACLE";
  readonly name = "Recursive Fibonacci";
  readonly category = "RECURSION";
  readonly description = "Computes the Nth Fibonacci number (F(0)=0, F(1)=1).";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    n: { type: "integer", min: 0, max: 25, default: 7 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? Math.max(0, Math.min(25, parameters.n)) : 7;
    return { n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const n = typeof input.n === "number" ? Math.max(0, Math.min(30, input.n)) : 0;

    if (n === 0) return { fibonacci: 0, result: 0 };
    if (n === 1) return { fibonacci: 1, result: 1 };

    let a = 0;
    let b = 1;
    for (let i = 2; i <= n; i++) {
      const c = a + b;
      a = b;
      b = c;
    }

    return {
      fibonacci: b,
      result: b,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.n !== "number" || input.n < 0 || input.n > 30) {
      errors.push("Input property 'n' must be an integer between 0 and 30.");
    }
    return errors;
  }
}

/**
 * 50. RECURSION_POWER_ORACLE
 */
@Injectable()
export class RecursionPowerOracle extends BaseOracle {
  readonly key = "RECURSION_POWER_ORACLE";
  readonly name = "Recursive Exponentiation";
  readonly category = "RECURSION";
  readonly description = "Computes base raised to the power of exponent.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    base: { type: "integer", min: 1, max: 10, default: 2 },
    exp: { type: "integer", min: 0, max: 10, default: 5 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const base = typeof parameters.base === "number" ? parameters.base : 2;
    const exp = typeof parameters.exp === "number" ? Math.max(0, Math.min(10, parameters.exp)) : 5;
    return { base, exp };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const base = typeof input.base === "number" ? input.base : 1;
    const exp = typeof input.exp === "number" ? Math.max(0, input.exp) : 0;
    const power = Math.pow(base, exp);

    return {
      power,
      result: power,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.base !== "number" || typeof input.exp !== "number" || input.exp < 0) {
      errors.push("Input properties 'base' and 'exp' (non-negative) must be numbers.");
    }
    return errors;
  }
}

/**
 * 51. RECURSION_SUM_N_ORACLE
 */
@Injectable()
export class RecursionSumNOracle extends BaseOracle {
  readonly key = "RECURSION_SUM_N_ORACLE";
  readonly name = "Recursive Sum of First N Numbers";
  readonly category = "RECURSION";
  readonly description = "Computes sum of first N natural numbers 1..N recursively.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    n: { type: "integer", min: 1, max: 100, default: 10 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? Math.max(1, parameters.n) : 10;
    return { n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const n = typeof input.n === "number" ? Math.max(0, input.n) : 0;
    const sum = (n * (n + 1)) / 2;

    return {
      sum,
      result: sum,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.n !== "number" || input.n < 0) {
      errors.push("Input property 'n' must be a non-negative integer.");
    }
    return errors;
  }
}

/**
 * 52. RECURSION_DIGIT_SUM_ORACLE
 */
@Injectable()
export class RecursionDigitSumOracle extends BaseOracle {
  readonly key = "RECURSION_DIGIT_SUM_ORACLE";
  readonly name = "Recursive Sum of Digits";
  readonly category = "RECURSION";
  readonly description = "Computes sum of digits of an integer using recursion.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    n: { type: "integer", min: 0, max: 1000000, default: 4567 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? parameters.n : 4567;
    return { n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const n = Math.abs(typeof input.n === "number" ? input.n : 0);
    const sum = String(n)
      .split("")
      .reduce((acc, d) => acc + parseInt(d, 10), 0);

    return {
      digitSum: sum,
      result: sum,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.n !== "number") errors.push("Input property 'n' must be a number.");
    return errors;
  }
}

/**
 * 53. RECURSION_DIGIT_COUNT_ORACLE
 */
@Injectable()
export class RecursionDigitCountOracle extends BaseOracle {
  readonly key = "RECURSION_DIGIT_COUNT_ORACLE";
  readonly name = "Recursive Count of Digits";
  readonly category = "RECURSION";
  readonly description = "Counts number of digits in an integer using recursion.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    n: { type: "integer", min: 0, max: 10000000, default: 98765 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? parameters.n : 98765;
    return { n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const n = Math.abs(typeof input.n === "number" ? input.n : 0);
    const count = String(n).length;

    return {
      digitCount: count,
      result: count,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.n !== "number") errors.push("Input property 'n' must be a number.");
    return errors;
  }
}
