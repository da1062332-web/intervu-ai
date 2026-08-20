import { Injectable } from "@nestjs/common";
import { BaseOracle } from "./base.oracle";

/**
 * 20. ARRAY_SUM_ORACLE
 */
@Injectable()
export class ArraySumOracle extends BaseOracle {
  readonly key = "ARRAY_SUM_ORACLE";
  readonly name = "Array Sum";
  readonly category = "ARRAY";
  readonly description = "Calculates the sum of all array elements.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    arraySize: { type: "integer", min: 1, max: 20, default: 5 },
    minVal: { type: "integer", min: 1, max: 20, default: 2 },
    maxVal: { type: "integer", min: 25, max: 100, default: 50 },
    startVal: { type: "integer", min: 1, max: 100, default: 1 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const size = typeof parameters.arraySize === "number" ? Math.max(1, parameters.arraySize) : 5;
    const min = typeof parameters.minVal === "number" ? parameters.minVal : 2;
    const max = typeof parameters.maxVal === "number" ? parameters.maxVal : 50;
    const start = typeof parameters.startVal === "number" ? parameters.startVal : 1;

    const arr: number[] = [];
    for (let i = 0; i < size; i++) {
      arr.push(min + ((start + i * 7) % (Math.max(1, max - min + 1))));
    }
    return { arr };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = Array.isArray(input.arr) ? input.arr : [];
    const sum = arr.reduce((acc, curr) => acc + (typeof curr === "number" ? curr : 0), 0);

    return {
      sum,
      result: sum,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.arr)) errors.push("Input property 'arr' must be an array.");
    return errors;
  }
}

/**
 * 21. ARRAY_MAX_ORACLE
 */
@Injectable()
export class ArrayMaxOracle extends BaseOracle {
  readonly key = "ARRAY_MAX_ORACLE";
  readonly name = "Array Maximum";
  readonly category = "ARRAY";
  readonly description = "Finds the maximum array element.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    arraySize: { type: "integer", min: 1, max: 20, default: 6 },
    minVal: { type: "integer", min: 1, max: 20, default: 5 },
    maxVal: { type: "integer", min: 50, max: 200, default: 100 },
    startVal: { type: "integer", min: 1, max: 100, default: 1 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const size = typeof parameters.arraySize === "number" ? Math.max(1, parameters.arraySize) : 6;
    const min = typeof parameters.minVal === "number" ? parameters.minVal : 5;
    const max = typeof parameters.maxVal === "number" ? parameters.maxVal : 100;
    const start = typeof parameters.startVal === "number" ? parameters.startVal : 1;

    const arr: number[] = [];
    for (let i = 0; i < size; i++) {
      arr.push(min + ((start + i * 13) % (Math.max(1, max - min + 1))));
    }
    return { arr };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = Array.isArray(input.arr) ? input.arr : [];
    const max = arr.length > 0 ? Math.max(...arr) : 0;

    return {
      max,
      result: max,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.arr) || input.arr.length === 0) {
      errors.push("Input property 'arr' must be a non-empty array.");
    }
    return errors;
  }
}

/**
 * 22. ARRAY_MIN_ORACLE
 */
@Injectable()
export class ArrayMinOracle extends BaseOracle {
  readonly key = "ARRAY_MIN_ORACLE";
  readonly name = "Array Minimum";
  readonly category = "ARRAY";
  readonly description = "Finds the minimum array element.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    arraySize: { type: "integer", min: 1, max: 20, default: 6 },
    minVal: { type: "integer", min: 1, max: 20, default: 3 },
    maxVal: { type: "integer", min: 50, max: 200, default: 90 },
    startVal: { type: "integer", min: 1, max: 100, default: 1 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const size = typeof parameters.arraySize === "number" ? Math.max(1, parameters.arraySize) : 6;
    const min = typeof parameters.minVal === "number" ? parameters.minVal : 3;
    const max = typeof parameters.maxVal === "number" ? parameters.maxVal : 90;
    const start = typeof parameters.startVal === "number" ? parameters.startVal : 1;

    const arr: number[] = [];
    for (let i = 0; i < size; i++) {
      arr.push(min + ((start + i * 11) % (Math.max(1, max - min + 1))));
    }
    return { arr };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = Array.isArray(input.arr) ? input.arr : [];
    const min = arr.length > 0 ? Math.min(...arr) : 0;

    return {
      min,
      result: min,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.arr) || input.arr.length === 0) {
      errors.push("Input property 'arr' must be a non-empty array.");
    }
    return errors;
  }
}

/**
 * 23. ARRAY_REVERSE_ORACLE
 */
@Injectable()
export class ArrayReverseOracle extends BaseOracle {
  readonly key = "ARRAY_REVERSE_ORACLE";
  readonly name = "Array Reverse";
  readonly category = "ARRAY";
  readonly description = "Reverses array ordering.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    arraySize: { type: "integer", min: 1, max: 20, default: 5 },
    startVal: { type: "integer", min: 1, max: 100, default: 10 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const size = typeof parameters.arraySize === "number" ? Math.max(1, parameters.arraySize) : 5;
    const start = typeof parameters.startVal === "number" ? parameters.startVal : 10;

    const arr: number[] = [];
    for (let i = 0; i < size; i++) {
      arr.push(start + i * 5);
    }
    return { arr };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = Array.isArray(input.arr) ? [...input.arr] : [];
    const reversedArr = arr.reverse();

    return {
      reversedArr,
      result: reversedArr,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.arr)) errors.push("Input property 'arr' must be an array.");
    return errors;
  }
}

/**
 * 24. ARRAY_COUNT_EVEN_ORACLE
 */
@Injectable()
export class ArrayCountEvenOracle extends BaseOracle {
  readonly key = "ARRAY_COUNT_EVEN_ORACLE";
  readonly name = "Count Even Elements";
  readonly category = "ARRAY";
  readonly description = "Counts even-valued elements in an array.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    arraySize: { type: "integer", min: 1, max: 20, default: 6 },
    startVal: { type: "integer", min: 1, max: 100, default: 1 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const size = typeof parameters.arraySize === "number" ? Math.max(1, parameters.arraySize) : 6;
    const start = typeof parameters.startVal === "number" ? parameters.startVal : 1;

    const arr: number[] = [];
    for (let i = 0; i < size; i++) {
      arr.push(start + i);
    }
    return { arr };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = Array.isArray(input.arr) ? input.arr : [];
    let count = 0;
    for (const val of arr) {
      if (typeof val === "number" && val % 2 === 0) {
        count++;
      }
    }

    return {
      evenCount: count,
      result: count,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.arr)) errors.push("Input property 'arr' must be an array.");
    return errors;
  }
}

/**
 * 25. ARRAY_FREQUENCY_ORACLE
 */
@Injectable()
export class ArrayFrequencyOracle extends BaseOracle {
  readonly key = "ARRAY_FREQUENCY_ORACLE";
  readonly name = "Array Element Frequency";
  readonly category = "ARRAY";
  readonly description = "Calculates frequency of each array value.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    arraySize: { type: "integer", min: 1, max: 20, default: 8 },
    startVal: { type: "integer", min: 1, max: 50, default: 1 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const size = typeof parameters.arraySize === "number" ? Math.max(1, parameters.arraySize) : 8;
    const start = typeof parameters.startVal === "number" ? parameters.startVal : 1;

    const arr: number[] = [];
    for (let i = 0; i < size; i++) {
      arr.push(start + (i % 3));
    }
    return { arr };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = Array.isArray(input.arr) ? input.arr : [];
    const frequencies: Record<string, number> = {};

    for (const val of arr) {
      frequencies[String(val)] = (frequencies[String(val)] || 0) + 1;
    }

    return {
      frequencies,
      result: frequencies,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.arr)) errors.push("Input property 'arr' must be an array.");
    return errors;
  }
}

/**
 * 26. ARRAY_SECOND_LARGEST_ORACLE
 */
@Injectable()
export class ArraySecondLargestOracle extends BaseOracle {
  readonly key = "ARRAY_SECOND_LARGEST_ORACLE";
  readonly name = "Second Largest Element";
  readonly category = "ARRAY";
  readonly description = "Finds the second-largest distinct value in an array.";
  readonly supportedDifficulties = ["EASY", "MEDIUM"];

  readonly parameterSchema = {
    arraySize: { type: "integer", min: 2, max: 20, default: 6 },
    startVal: { type: "integer", min: 1, max: 100, default: 3 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const size = typeof parameters.arraySize === "number" ? Math.max(2, parameters.arraySize) : 6;
    const start = typeof parameters.startVal === "number" ? parameters.startVal : 3;

    const arr: number[] = [];
    for (let i = 0; i < size; i++) {
      arr.push(start + (i * 4));
    }
    return { arr };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = Array.isArray(input.arr) ? input.arr : [];
    const uniqueSorted = Array.from(new Set(arr.filter((x): x is number => typeof x === "number"))).sort((a, b) => b - a);
    const secondLargest = uniqueSorted.length >= 2 ? uniqueSorted[1] : -1;

    return {
      secondLargest,
      result: secondLargest,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.arr)) errors.push("Input property 'arr' must be an array.");
    return errors;
  }
}

/**
 * 27. ARRAY_ROTATION_ORACLE
 */
@Injectable()
export class ArrayRotationOracle extends BaseOracle {
  readonly key = "ARRAY_ROTATION_ORACLE";
  readonly name = "Array Right Rotation";
  readonly category = "ARRAY";
  readonly description = "Rotates an array right by K positions.";
  readonly supportedDifficulties = ["EASY", "MEDIUM"];

  readonly parameterSchema = {
    arraySize: { type: "integer", min: 1, max: 20, default: 5 },
    k: { type: "integer", min: 0, max: 10, default: 2 },
    startVal: { type: "integer", min: 1, max: 100, default: 1 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const size = typeof parameters.arraySize === "number" ? Math.max(1, parameters.arraySize) : 5;
    const k = typeof parameters.k === "number" ? Math.max(0, parameters.k) : 2;
    const start = typeof parameters.startVal === "number" ? parameters.startVal : 1;

    const arr: number[] = [];
    for (let i = 0; i < size; i++) {
      arr.push(start + i);
    }
    return { arr, k };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = Array.isArray(input.arr) ? [...input.arr] : [];
    const k = typeof input.k === "number" ? input.k : 0;

    if (arr.length === 0) return { result: [] };
    const effectiveK = ((k % arr.length) + arr.length) % arr.length;
    const rotated = [...arr.slice(arr.length - effectiveK), ...arr.slice(0, arr.length - effectiveK)];

    return {
      rotatedArr: rotated,
      result: rotated,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.arr)) errors.push("Input property 'arr' must be an array.");
    if (typeof input.k !== "number") errors.push("Input property 'k' must be a number.");
    return errors;
  }
}

/**
 * 28. ARRAY_LEFT_ROTATION_ORACLE
 */
@Injectable()
export class ArrayLeftRotationOracle extends BaseOracle {
  readonly key = "ARRAY_LEFT_ROTATION_ORACLE";
  readonly name = "Array Left Rotation";
  readonly category = "ARRAY";
  readonly description = "Rotates an array left by K positions.";
  readonly supportedDifficulties = ["EASY", "MEDIUM"];

  readonly parameterSchema = {
    arraySize: { type: "integer", min: 1, max: 20, default: 5 },
    k: { type: "integer", min: 0, max: 10, default: 2 },
    startVal: { type: "integer", min: 1, max: 100, default: 1 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const size = typeof parameters.arraySize === "number" ? Math.max(1, parameters.arraySize) : 5;
    const k = typeof parameters.k === "number" ? Math.max(0, parameters.k) : 2;
    const start = typeof parameters.startVal === "number" ? parameters.startVal : 1;

    const arr: number[] = [];
    for (let i = 0; i < size; i++) {
      arr.push(start + i);
    }
    return { arr, k };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = Array.isArray(input.arr) ? [...input.arr] : [];
    const k = typeof input.k === "number" ? input.k : 0;

    if (arr.length === 0) return { result: [] };
    const effectiveK = ((k % arr.length) + arr.length) % arr.length;
    const rotated = [...arr.slice(effectiveK), ...arr.slice(0, effectiveK)];

    return {
      rotatedArr: rotated,
      result: rotated,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.arr)) errors.push("Input property 'arr' must be an array.");
    if (typeof input.k !== "number") errors.push("Input property 'k' must be a number.");
    return errors;
  }
}

/**
 * 29. ARRAY_REMOVE_DUPLICATES_ORACLE
 */
@Injectable()
export class ArrayRemoveDuplicatesOracle extends BaseOracle {
  readonly key = "ARRAY_REMOVE_DUPLICATES_ORACLE";
  readonly name = "Remove Array Duplicates";
  readonly category = "ARRAY";
  readonly description = "Removes duplicate values while preserving first occurrence order.";
  readonly supportedDifficulties = ["EASY", "MEDIUM"];

  readonly parameterSchema = {
    arraySize: { type: "integer", min: 1, max: 20, default: 8 },
    startVal: { type: "integer", min: 1, max: 50, default: 1 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const size = typeof parameters.arraySize === "number" ? Math.max(1, parameters.arraySize) : 8;
    const start = typeof parameters.startVal === "number" ? parameters.startVal : 1;

    const arr: number[] = [];
    for (let i = 0; i < size; i++) {
      arr.push(start + (i % 4));
    }
    return { arr };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = Array.isArray(input.arr) ? input.arr : [];
    const seen = new Set<any>();
    const uniqueArr: any[] = [];

    for (const val of arr) {
      if (!seen.has(val)) {
        seen.add(val);
        uniqueArr.push(val);
      }
    }

    return {
      uniqueArr,
      result: uniqueArr,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.arr)) errors.push("Input property 'arr' must be an array.");
    return errors;
  }
}

/**
 * 30. ARRAY_MOVE_ZEROS_ORACLE
 */
@Injectable()
export class ArrayMoveZerosOracle extends BaseOracle {
  readonly key = "ARRAY_MOVE_ZEROS_ORACLE";
  readonly name = "Move Zeros to End";
  readonly category = "ARRAY";
  readonly description = "Moves zeros to the end while preserving non-zero ordering.";
  readonly supportedDifficulties = ["EASY", "MEDIUM"];

  readonly parameterSchema = {
    arraySize: { type: "integer", min: 1, max: 20, default: 7 },
    startVal: { type: "integer", min: 1, max: 50, default: 1 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const size = typeof parameters.arraySize === "number" ? Math.max(1, parameters.arraySize) : 7;
    const start = typeof parameters.startVal === "number" ? parameters.startVal : 1;

    const arr: number[] = [];
    for (let i = 0; i < size; i++) {
      arr.push(i % 2 === 0 ? 0 : start + i);
    }
    return { arr };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = Array.isArray(input.arr) ? input.arr : [];
    const nonZeros = arr.filter((x) => x !== 0);
    const zeroCount = arr.length - nonZeros.length;
    const resultArr = [...nonZeros, ...Array(zeroCount).fill(0)];

    return {
      resultArr,
      result: resultArr,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.arr)) errors.push("Input property 'arr' must be an array.");
    return errors;
  }
}

/**
 * 31. ARRAY_LINEAR_SEARCH_ORACLE
 */
@Injectable()
export class ArrayLinearSearchOracle extends BaseOracle {
  readonly key = "ARRAY_LINEAR_SEARCH_ORACLE";
  readonly name = "Array Linear Search";
  readonly category = "ARRAY";
  readonly description = "Finds the first occurrence index of a target value or -1.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    arraySize: { type: "integer", min: 1, max: 20, default: 6 },
    target: { type: "integer", min: 1, max: 50, default: 15 },
    step: { type: "integer", min: 1, max: 10, default: 5 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const size = typeof parameters.arraySize === "number" ? Math.max(1, parameters.arraySize) : 6;
    const target = typeof parameters.target === "number" ? parameters.target : 15;
    const step = typeof parameters.step === "number" ? Math.max(1, parameters.step) : 5;

    const arr: number[] = [];
    for (let i = 0; i < size; i++) {
      arr.push((i + 1) * step);
    }
    return { arr, target };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = Array.isArray(input.arr) ? input.arr : [];
    const target = input.target;
    const index = arr.indexOf(target);

    return {
      index,
      result: index,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.arr)) errors.push("Input property 'arr' must be an array.");
    return errors;
  }
}

/**
 * 32. ARRAY_BINARY_SEARCH_ORACLE
 */
@Injectable()
export class ArrayBinarySearchOracle extends BaseOracle {
  readonly key = "ARRAY_BINARY_SEARCH_ORACLE";
  readonly name = "Array Binary Search";
  readonly category = "ARRAY";
  readonly description = "Searches for a target in a sorted array and returns zero-based index or -1.";
  readonly supportedDifficulties = ["EASY", "MEDIUM"];

  readonly parameterSchema = {
    arraySize: { type: "integer", min: 1, max: 20, default: 7 },
    target: { type: "integer", min: 1, max: 50, default: 14 },
    startVal: { type: "integer", min: 1, max: 20, default: 3 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const size = typeof parameters.arraySize === "number" ? Math.max(1, parameters.arraySize) : 7;
    const target = typeof parameters.target === "number" ? parameters.target : 14;
    const start = typeof parameters.startVal === "number" ? parameters.startVal : 3;

    const arr: number[] = [];
    for (let i = 0; i < size; i++) {
      arr.push(start + i * 2);
    }
    return { arr, target };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = Array.isArray(input.arr) ? input.arr : [];
    const target = typeof input.target === "number" ? input.target : 0;

    let left = 0;
    let right = arr.length - 1;
    let index = -1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (arr[mid] === target) {
        index = mid;
        break;
      } else if (arr[mid] < target) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return {
      index,
      result: index,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.arr)) errors.push("Input property 'arr' must be an array.");
    return errors;
  }
}

/**
 * 33. ARRAY_MISSING_NUMBER_ORACLE
 */
@Injectable()
export class ArrayMissingNumberOracle extends BaseOracle {
  readonly key = "ARRAY_MISSING_NUMBER_ORACLE";
  readonly name = "Find Missing Number in Sequence";
  readonly category = "ARRAY";
  readonly description = "Finds the missing number from a 0..N sequence.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    n: { type: "integer", min: 2, max: 20, default: 6 },
    missing: { type: "integer", min: 0, max: 20, default: 3 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? Math.max(2, parameters.n) : 6;
    const missing = typeof parameters.missing === "number" ? Math.min(n, Math.max(0, parameters.missing)) : 3;

    const arr: number[] = [];
    for (let i = 0; i <= n; i++) {
      if (i !== missing) arr.push(i);
    }
    return { arr, n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = Array.isArray(input.arr) ? input.arr : [];
    const n = typeof input.n === "number" ? input.n : arr.length;

    const expectedSum = (n * (n + 1)) / 2;
    const actualSum = arr.reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
    const missingNumber = expectedSum - actualSum;

    return {
      missingNumber,
      result: missingNumber,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.arr)) errors.push("Input property 'arr' must be an array.");
    return errors;
  }
}

/**
 * 34. ARRAY_DUPLICATE_NUMBER_ORACLE
 */
@Injectable()
export class ArrayDuplicateNumberOracle extends BaseOracle {
  readonly key = "ARRAY_DUPLICATE_NUMBER_ORACLE";
  readonly name = "Find Duplicate Number";
  readonly category = "ARRAY";
  readonly description = "Finds a duplicate value in an array.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    arraySize: { type: "integer", min: 3, max: 20, default: 6 },
    duplicateVal: { type: "integer", min: 1, max: 20, default: 3 },
    startVal: { type: "integer", min: 1, max: 50, default: 1 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const size = typeof parameters.arraySize === "number" ? Math.max(3, parameters.arraySize) : 6;
    const start = typeof parameters.startVal === "number" ? parameters.startVal : 1;
    const duplicate = typeof parameters.duplicateVal === "number" ? parameters.duplicateVal : 3;

    const arr: number[] = [];
    for (let i = 0; i < size - 1; i++) {
      arr.push(start + i);
    }
    const dup = arr.length > 0 ? arr[(duplicate - 1) % arr.length] : start;
    arr.push(dup);
    return { arr };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = Array.isArray(input.arr) ? input.arr : [];
    const seen = new Set<number>();
    let duplicateNumber = -1;

    for (const val of arr) {
      if (seen.has(val)) {
        duplicateNumber = val;
        break;
      }
      seen.add(val);
    }

    return {
      duplicateNumber,
      result: duplicateNumber,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.arr)) errors.push("Input property 'arr' must be an array.");
    return errors;
  }
}

/**
 * 35. ARRAY_COMMON_ELEMENTS_ORACLE
 */
@Injectable()
export class ArrayCommonElementsOracle extends BaseOracle {
  readonly key = "ARRAY_COMMON_ELEMENTS_ORACLE";
  readonly name = "Common Array Elements";
  readonly category = "ARRAY";
  readonly description = "Finds values common to two arrays in deterministic order.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    size1: { type: "integer", min: 2, max: 15, default: 5 },
    size2: { type: "integer", min: 2, max: 15, default: 5 },
    startVal1: { type: "integer", min: 1, max: 20, default: 2 },
    startVal2: { type: "integer", min: 1, max: 20, default: 3 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const s1 = typeof parameters.size1 === "number" ? Math.max(2, parameters.size1) : 5;
    const s2 = typeof parameters.size2 === "number" ? Math.max(2, parameters.size2) : 5;
    const start1 = typeof parameters.startVal1 === "number" ? parameters.startVal1 : 2;
    const start2 = typeof parameters.startVal2 === "number" ? parameters.startVal2 : 3;

    const arr1: number[] = [];
    for (let i = 0; i < s1; i++) arr1.push((i + 1) * start1);

    const arr2: number[] = [];
    for (let i = 0; i < s2; i++) arr2.push((i + 1) * start2);

    return { arr1, arr2 };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr1 = Array.isArray(input.arr1) ? input.arr1 : [];
    const arr2 = Array.isArray(input.arr2) ? input.arr2 : [];

    const set2 = new Set(arr2);
    const seen = new Set<any>();
    const common: any[] = [];

    for (const val of arr1) {
      if (set2.has(val) && !seen.has(val)) {
        seen.add(val);
        common.push(val);
      }
    }

    return {
      commonElements: common,
      result: common,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.arr1)) errors.push("Input property 'arr1' must be an array.");
    if (!Array.isArray(input.arr2)) errors.push("Input property 'arr2' must be an array.");
    return errors;
  }
}
