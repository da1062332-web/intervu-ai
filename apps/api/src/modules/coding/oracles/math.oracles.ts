import { Injectable } from "@nestjs/common";
import { BaseOracle } from "./base.oracle";

/**
 * 36. MATH_PRIME_CHECK_ORACLE
 */
@Injectable()
export class MathPrimeCheckOracle extends BaseOracle {
  readonly key = "MATH_PRIME_CHECK_ORACLE";
  readonly name = "Prime Number Check";
  readonly category = "MATH";
  readonly description = "Checks whether an integer is a prime number.";
  readonly supportedDifficulties = ["EASY", "MEDIUM"];

  readonly parameterSchema = {
    n: { type: "integer", min: 1, max: 10000, default: 29 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? parameters.n : 29;
    return { n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const n = typeof input.n === "number" ? input.n : 0;
    let isPrime = n >= 2;
    for (let i = 2; i * i <= n; i++) {
      if (n % i === 0) {
        isPrime = false;
        break;
      }
    }

    return {
      isPrime,
      result: isPrime,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.n !== "number") errors.push("Input property 'n' must be an integer.");
    return errors;
  }
}

/**
 * 37. MATH_GCD_ORACLE
 */
@Injectable()
export class MathGcdOracle extends BaseOracle {
  readonly key = "MATH_GCD_ORACLE";
  readonly name = "Greatest Common Divisor (GCD)";
  readonly category = "MATH";
  readonly description = "Computes the greatest common divisor of two integers.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    a: { type: "integer", min: 1, max: 1000, default: 48 },
    b: { type: "integer", min: 1, max: 1000, default: 18 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const a = typeof parameters.a === "number" ? Math.max(1, parameters.a) : 48;
    const b = typeof parameters.b === "number" ? Math.max(1, parameters.b) : 18;
    return { a, b };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    let x = Math.abs(typeof input.a === "number" ? input.a : 1);
    let y = Math.abs(typeof input.b === "number" ? input.b : 1);

    while (y !== 0) {
      const temp = y;
      y = x % y;
      x = temp;
    }

    return {
      gcd: x,
      result: x,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.a !== "number" || typeof input.b !== "number") {
      errors.push("Input properties 'a' and 'b' must be integers.");
    }
    return errors;
  }
}

/**
 * 38. MATH_LCM_ORACLE
 */
@Injectable()
export class MathLcmOracle extends BaseOracle {
  readonly key = "MATH_LCM_ORACLE";
  readonly name = "Least Common Multiple (LCM)";
  readonly category = "MATH";
  readonly description = "Computes the least common multiple of two integers.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    a: { type: "integer", min: 1, max: 500, default: 12 },
    b: { type: "integer", min: 1, max: 500, default: 15 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const a = typeof parameters.a === "number" ? Math.max(1, parameters.a) : 12;
    const b = typeof parameters.b === "number" ? Math.max(1, parameters.b) : 15;
    return { a, b };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const a = Math.abs(typeof input.a === "number" ? input.a : 1);
    const b = Math.abs(typeof input.b === "number" ? input.b : 1);

    let x = a;
    let y = b;
    while (y !== 0) {
      const temp = y;
      y = x % y;
      x = temp;
    }
    const gcd = x;
    const lcm = Math.round((a * b) / gcd);

    return {
      lcm,
      result: lcm,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.a !== "number" || typeof input.b !== "number") {
      errors.push("Input properties 'a' and 'b' must be integers.");
    }
    return errors;
  }
}

/**
 * 39. MATH_DIGIT_SUM_ORACLE
 */
@Injectable()
export class MathDigitSumOracle extends BaseOracle {
  readonly key = "MATH_DIGIT_SUM_ORACLE";
  readonly name = "Sum of Digits";
  readonly category = "MATH";
  readonly description = "Calculates the sum of decimal digits of an integer.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    n: { type: "integer", min: 0, max: 1000000, default: 12345 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? parameters.n : 12345;
    return { n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const n = Math.abs(typeof input.n === "number" ? input.n : 0);
    const sum = String(n)
      .split("")
      .reduce((acc, digit) => acc + parseInt(digit, 10), 0);

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
 * 40. MATH_DIGIT_COUNT_ORACLE
 */
@Injectable()
export class MathDigitCountOracle extends BaseOracle {
  readonly key = "MATH_DIGIT_COUNT_ORACLE";
  readonly name = "Count of Digits";
  readonly category = "MATH";
  readonly description = "Counts the total number of digits of an integer.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    n: { type: "integer", min: 0, max: 10000000, default: 987654 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? parameters.n : 987654;
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

/**
 * 41. MATH_NUMBER_REVERSE_ORACLE
 */
@Injectable()
export class MathNumberReverseOracle extends BaseOracle {
  readonly key = "MATH_NUMBER_REVERSE_ORACLE";
  readonly name = "Reverse Number Digits";
  readonly category = "MATH";
  readonly description = "Reverses the digits of an integer.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    n: { type: "integer", min: 1, max: 10000000, default: 12345 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? parameters.n : 12345;
    return { n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const n = typeof input.n === "number" ? input.n : 0;
    const sign = n < 0 ? -1 : 1;
    const reversedDigits = parseInt(String(Math.abs(n)).split("").reverse().join(""), 10);
    const reversed = sign * reversedDigits;

    return {
      reversedNumber: reversed,
      result: reversed,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.n !== "number") errors.push("Input property 'n' must be an integer.");
    return errors;
  }
}

/**
 * 42. MATH_DIGIT_PRODUCT_ORACLE
 */
@Injectable()
export class MathDigitProductOracle extends BaseOracle {
  readonly key = "MATH_DIGIT_PRODUCT_ORACLE";
  readonly name = "Product of Digits";
  readonly category = "MATH";
  readonly description = "Calculates the product of decimal digits of an integer.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    n: { type: "integer", min: 1, max: 1000000, default: 234 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? parameters.n : 234;
    return { n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const n = Math.abs(typeof input.n === "number" ? input.n : 0);
    const product = String(n)
      .split("")
      .reduce((acc, digit) => acc * parseInt(digit, 10), 1);

    return {
      digitProduct: product,
      result: product,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.n !== "number") errors.push("Input property 'n' must be a number.");
    return errors;
  }
}

/**
 * 43. MATH_ARMSTRONG_ORACLE
 */
@Injectable()
export class MathArmstrongOracle extends BaseOracle {
  readonly key = "MATH_ARMSTRONG_ORACLE";
  readonly name = "Armstrong Number Check";
  readonly category = "MATH";
  readonly description = "Checks whether a number is equal to the sum of its digits raised to the power of digit count.";
  readonly supportedDifficulties = ["EASY", "MEDIUM"];

  readonly parameterSchema = {
    n: { type: "integer", min: 1, max: 10000, default: 153 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? parameters.n : 153;
    return { n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const n = typeof input.n === "number" ? input.n : 0;
    if (n < 0) return { isArmstrong: false, result: false };

    const str = String(n);
    const numDigits = str.length;
    const sum = str.split("").reduce((acc, d) => acc + Math.pow(parseInt(d, 10), numDigits), 0);
    const isArmstrong = sum === n;

    return {
      isArmstrong,
      result: isArmstrong,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.n !== "number") errors.push("Input property 'n' must be a number.");
    return errors;
  }
}

/**
 * 44. MATH_PERFECT_NUMBER_ORACLE
 */
@Injectable()
export class MathPerfectNumberOracle extends BaseOracle {
  readonly key = "MATH_PERFECT_NUMBER_ORACLE";
  readonly name = "Perfect Number Check";
  readonly category = "MATH";
  readonly description = "Checks whether a number is equal to the sum of its proper positive divisors.";
  readonly supportedDifficulties = ["EASY", "MEDIUM"];

  readonly parameterSchema = {
    n: { type: "integer", min: 1, max: 10000, default: 28 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? parameters.n : 28;
    return { n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const n = typeof input.n === "number" ? input.n : 0;
    if (n <= 1) return { isPerfect: false, result: false };

    let sum = 1;
    for (let i = 2; i * i <= n; i++) {
      if (n % i === 0) {
        sum += i;
        if (i * i !== n) {
          sum += n / i;
        }
      }
    }

    const isPerfect = sum === n;
    return {
      isPerfect,
      result: isPerfect,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.n !== "number") errors.push("Input property 'n' must be an integer.");
    return errors;
  }
}

/**
 * 45. MATH_NUMBER_PALINDROME_ORACLE
 */
@Injectable()
export class MathNumberPalindromeOracle extends BaseOracle {
  readonly key = "MATH_NUMBER_PALINDROME_ORACLE";
  readonly name = "Number Palindrome Check";
  readonly category = "MATH";
  readonly description = "Determines whether an integer reads identically forwards and backwards.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    n: { type: "integer", min: 0, max: 1000000, default: 12321 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? parameters.n : 12321;
    return { n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const n = typeof input.n === "number" ? input.n : 0;
    if (n < 0) return { isPalindrome: false, result: false };

    const str = String(n);
    const reversed = str.split("").reverse().join("");
    const isPalindrome = str === reversed;

    return {
      isPalindrome,
      result: isPalindrome,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.n !== "number") errors.push("Input property 'n' must be a number.");
    return errors;
  }
}

/**
 * 46. MATH_DIGIT_FREQUENCY_ORACLE
 */
@Injectable()
export class MathDigitFrequencyOracle extends BaseOracle {
  readonly key = "MATH_DIGIT_FREQUENCY_ORACLE";
  readonly name = "Digit Frequency Map";
  readonly category = "MATH";
  readonly description = "Calculates the frequency of each decimal digit in an integer.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    n: { type: "integer", min: 0, max: 100000000, default: 1122334 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? parameters.n : 1122334;
    return { n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const n = Math.abs(typeof input.n === "number" ? input.n : 0);
    const frequencies: Record<string, number> = {};

    for (const d of String(n)) {
      frequencies[d] = (frequencies[d] || 0) + 1;
    }

    return {
      frequencies,
      result: frequencies,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.n !== "number") errors.push("Input property 'n' must be an integer.");
    return errors;
  }
}

/**
 * 47. MATH_FACTORIAL_ORACLE
 */
@Injectable()
export class MathFactorialOracle extends BaseOracle {
  readonly key = "MATH_FACTORIAL_ORACLE";
  readonly name = "Factorial Computation";
  readonly category = "MATH";
  readonly description = "Computes the exact factorial of a non-negative integer n (0 <= n <= 20).";
  readonly supportedDifficulties = ["EASY", "MEDIUM"];

  readonly parameterSchema = {
    n: { type: "integer", min: 0, max: 15, default: 5 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? Math.max(0, Math.min(15, parameters.n)) : 5;
    return { n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const n = typeof input.n === "number" ? Math.max(0, Math.min(20, input.n)) : 0;

    let factorial = 1;
    for (let i = 2; i <= n; i++) {
      factorial *= i;
    }

    return {
      factorial,
      result: factorial,
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
