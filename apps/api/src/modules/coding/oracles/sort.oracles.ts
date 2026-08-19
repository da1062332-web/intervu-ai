import { Injectable } from "@nestjs/common";
import { BaseOracle } from "./base.oracle";

/**
 * 54. SORT_BUBBLE_SORT_ORACLE
 */
@Injectable()
export class SortBubbleSortOracle extends BaseOracle {
  readonly key = "SORT_BUBBLE_SORT_ORACLE";
  readonly name = "Bubble Sort";
  readonly category = "SORT";
  readonly description = "Sorts an array in ascending order using bubble sort algorithm.";
  readonly supportedDifficulties = ["EASY", "MEDIUM"];

  readonly parameterSchema = {
    arraySize: { type: "integer", min: 2, max: 20, default: 6 },
    minVal: { type: "integer", min: 1, max: 20, default: 5 },
    maxVal: { type: "integer", min: 30, max: 100, default: 99 },
    startVal: { type: "integer", min: 1, max: 50, default: 7 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const size = typeof parameters.arraySize === "number" ? Math.max(2, parameters.arraySize) : 6;
    const min = typeof parameters.minVal === "number" ? parameters.minVal : 5;
    const max = typeof parameters.maxVal === "number" ? parameters.maxVal : 99;
    const start = typeof parameters.startVal === "number" ? parameters.startVal : 7;

    const arr: number[] = [];
    for (let i = 0; i < size; i++) {
      arr.push(min + ((i * 17 + start) % (Math.max(1, max - min + 1))));
    }
    return { arr };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = Array.isArray(input.arr) ? [...input.arr] : [];
    arr.sort((a, b) => (typeof a === "number" && typeof b === "number" ? a - b : 0));

    return {
      sortedArr: arr,
      result: arr,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.arr)) errors.push("Input property 'arr' must be an array.");
    return errors;
  }
}

/**
 * 55. SORT_SELECTION_SORT_ORACLE
 */
@Injectable()
export class SortSelectionSortOracle extends BaseOracle {
  readonly key = "SORT_SELECTION_SORT_ORACLE";
  readonly name = "Selection Sort";
  readonly category = "SORT";
  readonly description = "Sorts an array in ascending order using selection sort.";
  readonly supportedDifficulties = ["EASY", "MEDIUM"];

  readonly parameterSchema = {
    arraySize: { type: "integer", min: 2, max: 20, default: 6 },
    startVal: { type: "integer", min: 1, max: 50, default: 11 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const size = typeof parameters.arraySize === "number" ? Math.max(2, parameters.arraySize) : 6;
    const start = typeof parameters.startVal === "number" ? parameters.startVal : 11;

    const arr: number[] = [];
    for (let i = 0; i < size; i++) {
      arr.push(((size - i) * start) % 50 + 1);
    }
    return { arr };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = Array.isArray(input.arr) ? [...input.arr] : [];
    arr.sort((a, b) => a - b);

    return {
      sortedArr: arr,
      result: arr,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.arr)) errors.push("Input property 'arr' must be an array.");
    return errors;
  }
}

/**
 * 56. SORT_INSERTION_SORT_ORACLE
 */
@Injectable()
export class SortInsertionSortOracle extends BaseOracle {
  readonly key = "SORT_INSERTION_SORT_ORACLE";
  readonly name = "Insertion Sort";
  readonly category = "SORT";
  readonly description = "Sorts an array in ascending order using insertion sort.";
  readonly supportedDifficulties = ["EASY", "MEDIUM"];

  readonly parameterSchema = {
    arraySize: { type: "integer", min: 2, max: 20, default: 6 },
    startVal: { type: "integer", min: 1, max: 50, default: 23 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const size = typeof parameters.arraySize === "number" ? Math.max(2, parameters.arraySize) : 6;
    const start = typeof parameters.startVal === "number" ? parameters.startVal : 23;

    const arr: number[] = [];
    for (let i = 0; i < size; i++) {
      arr.push(((i * start + 5) % 60) + 1);
    }
    return { arr };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = Array.isArray(input.arr) ? [...input.arr] : [];
    arr.sort((a, b) => a - b);

    return {
      sortedArr: arr,
      result: arr,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.arr)) errors.push("Input property 'arr' must be an array.");
    return errors;
  }
}

/**
 * 57. SORT_MERGE_SORTED_ARRAYS_ORACLE
 */
@Injectable()
export class SortMergeSortedArraysOracle extends BaseOracle {
  readonly key = "SORT_MERGE_SORTED_ARRAYS_ORACLE";
  readonly name = "Merge Two Sorted Arrays";
  readonly category = "SORT";
  readonly description = "Merges two sorted arrays into a single sorted array.";
  readonly supportedDifficulties = ["EASY", "MEDIUM"];

  readonly parameterSchema = {
    size1: { type: "integer", min: 1, max: 15, default: 4 },
    size2: { type: "integer", min: 1, max: 15, default: 4 },
    startVal1: { type: "integer", min: 1, max: 20, default: 3 },
    startVal2: { type: "integer", min: 1, max: 20, default: 2 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const s1 = typeof parameters.size1 === "number" ? Math.max(1, parameters.size1) : 4;
    const s2 = typeof parameters.size2 === "number" ? Math.max(1, parameters.size2) : 4;
    const start1 = typeof parameters.startVal1 === "number" ? parameters.startVal1 : 3;
    const start2 = typeof parameters.startVal2 === "number" ? parameters.startVal2 : 2;

    const arr1: number[] = [];
    for (let i = 0; i < s1; i++) arr1.push((i + 1) * start1);

    const arr2: number[] = [];
    for (let i = 0; i < s2; i++) arr2.push((i + 1) * start2);

    return { arr1, arr2 };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr1 = Array.isArray(input.arr1) ? input.arr1 : [];
    const arr2 = Array.isArray(input.arr2) ? input.arr2 : [];

    const merged = [...arr1, ...arr2].sort((a, b) => a - b);

    return {
      mergedArr: merged,
      result: merged,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.arr1)) errors.push("Input property 'arr1' must be an array.");
    if (!Array.isArray(input.arr2)) errors.push("Input property 'arr2' must be an array.");
    return errors;
  }
}

/**
 * 58. SORT_CHECK_SORTED_ORACLE
 */
@Injectable()
export class SortCheckSortedOracle extends BaseOracle {
  readonly key = "SORT_CHECK_SORTED_ORACLE";
  readonly name = "Check If Array Is Sorted";
  readonly category = "SORT";
  readonly description = "Determines whether an array is sorted in ascending order.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    arraySize: { type: "integer", min: 2, max: 20, default: 5 },
    isSorted: { type: "boolean", default: true },
    startVal: { type: "integer", min: 1, max: 50, default: 10 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const size = typeof parameters.arraySize === "number" ? Math.max(2, parameters.arraySize) : 5;
    const isSorted = parameters.isSorted !== false;
    const start = typeof parameters.startVal === "number" ? parameters.startVal : 10;

    const arr: number[] = [];
    for (let i = 0; i < size; i++) {
      arr.push(start + i * 5);
    }
    if (!isSorted && arr.length >= 2) {
      const temp = arr[0];
      arr[0] = arr[arr.length - 1];
      arr[arr.length - 1] = temp;
    }

    return { arr };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = Array.isArray(input.arr) ? input.arr : [];

    let isSorted = true;
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] > arr[i + 1]) {
        isSorted = false;
        break;
      }
    }

    return {
      isSorted,
      result: isSorted,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.arr)) errors.push("Input property 'arr' must be an array.");
    return errors;
  }
}

/**
 * 59. SORT_CUSTOM_ORDER_ORACLE
 */
@Injectable()
export class SortCustomOrderOracle extends BaseOracle {
  readonly key = "SORT_CUSTOM_ORDER_ORACLE";
  readonly name = "Custom Order Sort";
  readonly category = "SORT";
  readonly description = "Sorts an array in custom order (e.g. descending).";
  readonly supportedDifficulties = ["EASY", "MEDIUM"];

  readonly parameterSchema = {
    arraySize: { type: "integer", min: 2, max: 20, default: 6 },
    order: { type: "enum", options: ["DESCENDING", "ASCENDING"], default: "DESCENDING" },
    startVal: { type: "integer", min: 1, max: 50, default: 7 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const size = typeof parameters.arraySize === "number" ? Math.max(2, parameters.arraySize) : 6;
    const order = parameters.order === "ASCENDING" ? "ASCENDING" : "DESCENDING";
    const start = typeof parameters.startVal === "number" ? parameters.startVal : 7;

    const arr: number[] = [];
    for (let i = 0; i < size; i++) {
      arr.push((i * start + 3) % 40 + 1);
    }
    return { arr, order };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = Array.isArray(input.arr) ? [...input.arr] : [];
    const order = input.order === "ASCENDING" ? "ASCENDING" : "DESCENDING";

    if (order === "DESCENDING") {
      arr.sort((a, b) => b - a);
    } else {
      arr.sort((a, b) => a - b);
    }

    return {
      sortedArr: arr,
      result: arr,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.arr)) errors.push("Input property 'arr' must be an array.");
    return errors;
  }
}

/**
 * 60. SORT_BY_FREQUENCY_ORACLE
 */
@Injectable()
export class SortByFrequencyOracle extends BaseOracle {
  readonly key = "SORT_BY_FREQUENCY_ORACLE";
  readonly name = "Sort Elements by Frequency";
  readonly category = "SORT";
  readonly description = "Sorts array elements by frequency descending, tie-breaking by smaller value.";
  readonly supportedDifficulties = ["MEDIUM"];

  readonly parameterSchema = {
    arraySize: { type: "integer", min: 2, max: 20, default: 8 },
    startVal: { type: "integer", min: 1, max: 50, default: 1 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const size = typeof parameters.arraySize === "number" ? Math.max(2, parameters.arraySize) : 8;
    const start = typeof parameters.startVal === "number" ? parameters.startVal : 1;

    const arr: number[] = [];
    for (let i = 0; i < size; i++) {
      arr.push(start + (i % 3));
    }
    return { arr };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = Array.isArray(input.arr) ? [...input.arr] : [];
    const freq: Record<number, number> = {};

    for (const val of arr) {
      freq[val] = (freq[val] || 0) + 1;
    }

    arr.sort((a, b) => {
      const fA = freq[a] || 0;
      const fB = freq[b] || 0;
      if (fA !== fB) {
        return fB - fA; // Frequency descending
      }
      return a - b; // Smaller value tie-breaker
    });

    return {
      sortedArr: arr,
      result: arr,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.arr)) errors.push("Input property 'arr' must be an array.");
    return errors;
  }
}

/**
 * 61. SORT_EVEN_ODD_ORACLE
 */
@Injectable()
export class SortEvenOddOracle extends BaseOracle {
  readonly key = "SORT_EVEN_ODD_ORACLE";
  readonly name = "Sort Even and Odd Elements";
  readonly category = "SORT";
  readonly description = "Sorts even numbers ascending first, followed by odd numbers ascending.";
  readonly supportedDifficulties = ["EASY", "MEDIUM"];

  readonly parameterSchema = {
    arraySize: { type: "integer", min: 2, max: 20, default: 8 },
    startVal: { type: "integer", min: 1, max: 50, default: 1 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const size = typeof parameters.arraySize === "number" ? Math.max(2, parameters.arraySize) : 8;
    const start = typeof parameters.startVal === "number" ? parameters.startVal : 1;

    const arr: number[] = [];
    for (let i = 0; i < size; i++) {
      arr.push((start + i * 3) % 30);
    }
    return { arr };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = Array.isArray(input.arr) ? [...input.arr] : [];
    const evens = arr.filter((x) => typeof x === "number" && x % 2 === 0).sort((a, b) => a - b);
    const odds = arr.filter((x) => typeof x === "number" && x % 2 !== 0).sort((a, b) => a - b);
    const resultArr = [...evens, ...odds];

    return {
      sortedArr: resultArr,
      result: resultArr,
    };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.arr)) errors.push("Input property 'arr' must be an array.");
    return errors;
  }
}
