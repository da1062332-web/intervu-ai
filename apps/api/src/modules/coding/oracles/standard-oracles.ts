import { Injectable } from "@nestjs/common";
import { BaseOracle } from "./base.oracle";

// Helper function to extract array from input or parameters
function getArrayParam(input: Record<string, any>, paramKey = "arr", defaultSize = 5): any[] {
  if (Array.isArray(input[paramKey])) return input[paramKey];
  if (Array.isArray(input.array)) return input.array;
  if (Array.isArray(input.nums)) return input.nums;
  
  // Generate default array based on parameters if provided
  const arraySize = typeof input.arraySize === "number" ? input.arraySize : defaultSize;
  const minVal = typeof input.minVal === "number" ? input.minVal : 1;
  const maxVal = typeof input.maxVal === "number" ? input.maxVal : 100;
  const arr: number[] = [];
  for (let i = 0; i < arraySize; i++) {
    const val = minVal + (i * 7) % (maxVal - minVal + 1);
    arr.push(val);
  }
  return arr;
}

function getStringParam(input: Record<string, any>, paramKey = "str", defaultVal = "hello world"): string {
  if (typeof input[paramKey] === "string") return input[paramKey];
  if (typeof input.str === "string") return input.str;
  if (typeof input.word === "string") return input.word;
  if (typeof input.text === "string") return input.text;
  return defaultVal;
}

// 1. Reverse an Array
@Injectable()
export class ArrayReverseOracle extends BaseOracle {
  readonly key = "ARRAY_REVERSE_ORACLE";
  readonly name = "Reverse an Array";
  readonly category = "ARRAY";
  readonly description = "Generates array input and produces the reversed array as expected output.";
  readonly parameterSchema = {
    arraySize: { type: "integer", min: 3, max: 15, default: 5 },
    minVal: { type: "integer", min: 1, max: 10, default: 1 },
    maxVal: { type: "integer", min: 20, max: 100, default: 100 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    return { arr: getArrayParam(parameters, "arr", 5) };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = getArrayParam(input, "arr", 5);
    return { result: [...arr].reverse() };
  }
}

// 2. Find Maximum in Array
@Injectable()
export class ArrayMaxOracle extends BaseOracle {
  readonly key = "ARRAY_MAX_ORACLE";
  readonly name = "Find Maximum in Array";
  readonly category = "ARRAY";
  readonly description = "Generates array input and computes the maximum element.";
  readonly parameterSchema = {
    arraySize: { type: "integer", min: 3, max: 15, default: 5 },
    minVal: { type: "integer", min: 1, max: 10, default: 1 },
    maxVal: { type: "integer", min: 20, max: 100, default: 100 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    return { arr: getArrayParam(parameters, "arr", 5) };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = getArrayParam(input, "arr", 5);
    if (arr.length === 0) return { result: null };
    return { result: Math.max(...arr) };
  }
}

// 3. Find Minimum in Array
@Injectable()
export class ArrayMinOracle extends BaseOracle {
  readonly key = "ARRAY_MIN_ORACLE";
  readonly name = "Find Minimum in Array";
  readonly category = "ARRAY";
  readonly description = "Generates array input and computes the minimum element.";
  readonly parameterSchema = {
    arraySize: { type: "integer", min: 3, max: 15, default: 5 },
    minVal: { type: "integer", min: 1, max: 10, default: 1 },
    maxVal: { type: "integer", min: 20, max: 100, default: 100 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    return { arr: getArrayParam(parameters, "arr", 5) };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = getArrayParam(input, "arr", 5);
    if (arr.length === 0) return { result: null };
    return { result: Math.min(...arr) };
  }
}

// 4. Sum of Array Elements
@Injectable()
export class ArraySumOracle extends BaseOracle {
  readonly key = "ARRAY_SUM_ORACLE";
  readonly name = "Sum of Array Elements";
  readonly category = "ARRAY";
  readonly description = "Generates array input and computes the sum of all elements.";
  readonly parameterSchema = {
    arraySize: { type: "integer", min: 3, max: 15, default: 5 },
    minVal: { type: "integer", min: 1, max: 10, default: 1 },
    maxVal: { type: "integer", min: 20, max: 100, default: 100 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    return { arr: getArrayParam(parameters, "arr", 5) };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = getArrayParam(input, "arr", 5);
    const sum = arr.reduce((acc, val) => acc + (typeof val === "number" ? val : 0), 0);
    return { result: sum };
  }
}

// 5. Count Even Numbers
@Injectable()
export class ArrayCountEvenOracle extends BaseOracle {
  readonly key = "ARRAY_COUNT_EVEN_ORACLE";
  readonly name = "Count Even Numbers Oracle";
  readonly category = "ARRAY";
  readonly description = "Generates array input and counts the number of even integers.";
  readonly parameterSchema = {
    arraySize: { type: "integer", min: 3, max: 15, default: 5 },
    minVal: { type: "integer", min: 1, max: 10, default: 1 },
    maxVal: { type: "integer", min: 20, max: 100, default: 100 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    return { arr: getArrayParam(parameters, "arr", 5) };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = getArrayParam(input, "arr", 5);
    const count = arr.filter((val) => typeof val === "number" && val % 2 === 0).length;
    return { result: count };
  }
}

// 6. Linear Search
@Injectable()
export class LinearSearchOracle extends BaseOracle {
  readonly key = "LINEAR_SEARCH_ORACLE";
  readonly name = "Linear Search Oracle";
  readonly category = "ARRAY";
  readonly description = "Generates array and target value input, returning index or -1.";
  readonly parameterSchema = {
    arraySize: { type: "integer", min: 4, max: 15, default: 5 },
    target: { type: "integer", min: 1, max: 100, default: 15 },
    minVal: { type: "integer", min: 1, max: 10, default: 1 },
    maxVal: { type: "integer", min: 20, max: 100, default: 100 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const arr = getArrayParam(parameters, "arr", 5);
    const target = typeof parameters.target === "number" ? parameters.target : (arr[2] ?? 5);
    return { arr, target };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = getArrayParam(input, "arr", 5);
    const target = typeof input.target === "number" ? input.target : 0;
    const index = arr.indexOf(target);
    return { result: index };
  }
}

// 7. Array Rotation (handled in array-rotation.oracle.ts, exported here for key compatibility)
export { ArrayRotationOracle } from "./array-rotation.oracle";

// 8. Check Sorted Array
@Injectable()
export class ArraySortedCheckOracle extends BaseOracle {
  readonly key = "ARRAY_SORTED_CHECK_ORACLE";
  readonly name = "Check Sorted Array Oracle";
  readonly category = "ARRAY";
  readonly description = "Generates array input and checks if it is sorted in non-decreasing order.";
  readonly parameterSchema = {
    arraySize: { type: "integer", min: 3, max: 15, default: 5 },
    minVal: { type: "integer", min: 1, max: 10, default: 1 },
    maxVal: { type: "integer", min: 20, max: 100, default: 100 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    return { arr: getArrayParam(parameters, "arr", 5) };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = getArrayParam(input, "arr", 5);
    let isSorted = true;
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] > arr[i + 1]) {
        isSorted = false;
        break;
      }
    }
    return { result: isSorted };
  }
}

// 9. Remove Duplicates
@Injectable()
export class ArrayRemoveDuplicatesOracle extends BaseOracle {
  readonly key = "ARRAY_REMOVE_DUPLICATES_ORACLE";
  readonly name = "Remove Duplicates Oracle";
  readonly category = "ARRAY";
  readonly description = "Generates array input and returns an array with duplicate values removed.";
  readonly parameterSchema = {
    arraySize: { type: "integer", min: 5, max: 20, default: 8 },
    minVal: { type: "integer", min: 1, max: 5, default: 1 },
    maxVal: { type: "integer", min: 5, max: 15, default: 10 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    return { arr: getArrayParam(parameters, "arr", 5) };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = getArrayParam(input, "arr", 5);
    return { result: Array.from(new Set(arr)) };
  }
}

// 10. Second Largest Element
@Injectable()
export class ArraySecondLargestOracle extends BaseOracle {
  readonly key = "ARRAY_SECOND_LARGEST_ORACLE";
  readonly name = "Second Largest Element Oracle";
  readonly category = "ARRAY";
  readonly description = "Generates array input and finds the second distinct largest element.";
  readonly parameterSchema = {
    arraySize: { type: "integer", min: 4, max: 15, default: 6 },
    minVal: { type: "integer", min: 1, max: 10, default: 1 },
    maxVal: { type: "integer", min: 20, max: 100, default: 100 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    return { arr: getArrayParam(parameters, "arr", 5) };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = getArrayParam(input, "arr", 5);
    const uniqueVals = Array.from(new Set(arr.filter((val) => typeof val === "number"))).sort((a, b) => b - a);
    const secondLargest = uniqueVals.length >= 2 ? uniqueVals[1] : null;
    return { result: secondLargest };
  }
}

// 11. Reverse a String
@Injectable()
export class StringReverseOracle extends BaseOracle {
  readonly key = "STRING_REVERSE_ORACLE";
  readonly name = "Reverse a String Oracle";
  readonly category = "STRING";
  readonly description = "Generates string input and produces the reversed string.";
  readonly parameterSchema = {
    str: {
      type: "string",
      options: [
        "hello", "world", "algorithm", "javascript", "intervu",
        "frontend", "backend", "fullstack", "typescript", "architecture"
      ],
      default: "hello",
    },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    return { str: getStringParam(parameters, "str", "hello") };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const str = getStringParam(input, "str", "hello");
    return { result: str.split("").reverse().join("") };
  }
}

// 12. Check Palindrome (handled in palindrome.oracle.ts, exported here for key compatibility)
export { PalindromeOracle } from "./palindrome.oracle";

// 13. Count Vowels
@Injectable()
export class StringCountVowelsOracle extends BaseOracle {
  readonly key = "STRING_COUNT_VOWELS_ORACLE";
  readonly name = "Count Vowels Oracle";
  readonly category = "STRING";
  readonly description = "Generates string input and counts the total number of vowels (a, e, i, o, u).";
  readonly parameterSchema = {
    str: {
      type: "string",
      options: [
        "hello world", "education", "programming", "intervu ai", "developer",
        "typescript", "architecture", "algorithm design"
      ],
      default: "hello world",
    },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    return { str: getStringParam(parameters, "str", "hello world") };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const str = getStringParam(input, "str", "hello world");
    const count = (str.match(/[aeiouAEIOU]/g) || []).length;
    return { result: count };
  }
}

// 14. Count Characters
@Injectable()
export class StringCharacterCountOracle extends BaseOracle {
  readonly key = "STRING_CHARACTER_COUNT_ORACLE";
  readonly name = "Count Characters Oracle";
  readonly category = "STRING";
  readonly description = "Generates string input and returns character frequency counts.";
  readonly parameterSchema = {
    str: {
      type: "string",
      options: [
        "hello", "banana", "mississippi", "intervu", "assessment",
        "developer", "engineering", "optimization"
      ],
      default: "hello",
    },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    return { str: getStringParam(parameters, "str", "hello") };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const str = getStringParam(input, "str", "hello");
    const counts: Record<string, number> = {};
    for (const char of str) {
      counts[char] = (counts[char] || 0) + 1;
    }
    return { result: counts };
  }
}

// 15. Remove Spaces
@Injectable()
export class StringRemoveSpacesOracle extends BaseOracle {
  readonly key = "STRING_REMOVE_SPACES_ORACLE";
  readonly name = "Remove Spaces Oracle";
  readonly category = "STRING";
  readonly description = "Generates string input and removes all whitespace characters.";
  readonly parameterSchema = {
    str: {
      type: "string",
      options: [
        "hello world extra spaces",
        "  remove   leading trailing  ",
        "coding  pattern   execution",
        "intervu   ai   platform",
        "  clean   formatted   string  ",
        "multiple   spaces   between   words",
        "  tab   and   space   mix  ",
        "automated   assessment   engine"
      ],
      default: "hello world extra spaces",
    },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    return { str: getStringParam(parameters, "str", "hello world extra spaces") };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const str = getStringParam(input, "str", "hello world");
    return { result: str.replace(/\s+/g, "") };
  }
}

// 16. Check Anagram
@Injectable()
export class StringAnagramOracle extends BaseOracle {
  readonly key = "STRING_ANAGRAM_ORACLE";
  readonly name = "Check Anagram Oracle";
  readonly category = "STRING";
  readonly description = "Generates two string inputs and checks if they are anagrams.";
  readonly parameterSchema = {
    str1: { type: "string", default: "listen" },
    str2: { type: "string", default: "silent" },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const str1 = typeof parameters.str1 === "string" ? parameters.str1 : "listen";
    const str2 = typeof parameters.str2 === "string" ? parameters.str2 : "silent";
    return { str1, str2 };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const normalize = (s: any) =>
      typeof s === "string" ? s.toLowerCase().replace(/[^a-z0-9]/g, "").split("").sort().join("") : "";
    const s1 = normalize(input.str1);
    const s2 = normalize(input.str2);
    return { result: s1 === s2 };
  }
}

// 17. Count Words
@Injectable()
export class StringWordCountOracle extends BaseOracle {
  readonly key = "STRING_WORD_COUNT_ORACLE";
  readonly name = "Count Words Oracle";
  readonly category = "STRING";
  readonly description = "Generates string input and counts the total number of words.";
  readonly parameterSchema = {
    str: {
      type: "string",
      options: [
        "The quick brown fox jumps over the lazy dog",
        "Coding interview patterns and algorithms",
        "InterVu AI automated technical assessment platform",
        "Software engineering core fundamentals and concepts",
        "Full stack web development tutorial series",
        "System design scalability principles and patterns",
        "Database indexing and query performance optimization",
        "Cloud infrastructure deployment and monitoring tools"
      ],
      default: "The quick brown fox jumps",
    },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    return { str: getStringParam(parameters, "str", "The quick brown fox jumps") };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const str = getStringParam(input, "str", "");
    const trimmed = str.trim();
    if (!trimmed) return { result: 0 };
    const count = trimmed.split(/\s+/).length;
    return { result: count };
  }
}

// 18. Find Largest Word
@Injectable()
export class StringLargestWordOracle extends BaseOracle {
  readonly key = "STRING_LARGEST_WORD_ORACLE";
  readonly name = "Find Largest Word Oracle";
  readonly category = "STRING";
  readonly description = "Generates text input and returns the longest word.";
  readonly parameterSchema = {
    str: {
      type: "string",
      options: [
        "Coding interview patterns and algorithms",
        "Artificial intelligence automated candidate evaluation",
        "Web application architecture performance optimization",
        "Microservices infrastructure orchestration deployment",
        "Distributed database replication sharding consistency",
        "Object oriented programming encapsulation polymorphism",
        "Asynchronous event driven nonblocking stream processing",
        "Containerized application continuous integration pipeline"
      ],
      default: "Coding interview patterns and algorithms",
    },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    return { str: getStringParam(parameters, "str", "Coding interview patterns and algorithms") };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const str = getStringParam(input, "str", "");
    const words = str.match(/\b\w+\b/g) || [];
    let largest = "";
    for (const w of words) {
      if (w.length > largest.length) {
        largest = w;
      }
    }
    return { result: largest };
  }
}

// 19. Factorial
@Injectable()
export class MathFactorialOracle extends BaseOracle {
  readonly key = "MATH_FACTORIAL_ORACLE";
  readonly name = "Factorial Oracle";
  readonly category = "MATH";
  readonly description = "Generates integer n input and computes factorial n!.";
  readonly parameterSchema = {
    n: { type: "integer", min: 1, max: 12, default: 5 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? parameters.n : 5;
    return { n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const n = typeof input.n === "number" ? Math.max(0, input.n) : 0;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return { result };
  }
}

// 20. Fibonacci Series
@Injectable()
export class MathFibonacciOracle extends BaseOracle {
  readonly key = "MATH_FIBONACCI_ORACLE";
  readonly name = "Fibonacci Series Oracle";
  readonly category = "MATH";
  readonly description = "Generates integer n input and computes the n-th Fibonacci number or series.";
  readonly parameterSchema = {
    n: { type: "integer", min: 1, max: 30, default: 7 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? parameters.n : 7;
    return { n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const n = typeof input.n === "number" ? Math.max(0, input.n) : 0;
    if (n === 0) return { result: 0 };
    if (n === 1) return { result: 1 };
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
      const c = a + b;
      a = b;
      b = c;
    }
    return { result: b };
  }
}

// 21. Prime Number Check
@Injectable()
export class MathPrimeCheckOracle extends BaseOracle {
  readonly key = "MATH_PRIME_CHECK_ORACLE";
  readonly name = "Prime Number Check Oracle";
  readonly category = "MATH";
  readonly description = "Generates integer n input and checks if n is a prime number.";
  readonly parameterSchema = {
    n: { type: "integer", min: 2, max: 10000, default: 29 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? parameters.n : 29;
    return { n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const n = typeof input.n === "number" ? input.n : 0;
    if (n <= 1) return { result: false };
    if (n <= 3) return { result: true };
    if (n % 2 === 0 || n % 3 === 0) return { result: false };
    let isPrime = true;
    for (let i = 5; i * i <= n; i += 6) {
      if (n % i === 0 || n % (i + 2) === 0) {
        isPrime = false;
        break;
      }
    }
    return { result: isPrime };
  }
}

// 22. GCD of Two Numbers
@Injectable()
export class MathGcdOracle extends BaseOracle {
  readonly key = "MATH_GCD_ORACLE";
  readonly name = "GCD of Two Numbers Oracle";
  readonly category = "MATH";
  readonly description = "Generates two integers (a, b) and computes Greatest Common Divisor.";
  readonly parameterSchema = {
    a: { type: "integer", min: 1, max: 500, default: 48 },
    b: { type: "integer", min: 1, max: 500, default: 18 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const a = typeof parameters.a === "number" ? parameters.a : 48;
    const b = typeof parameters.b === "number" ? parameters.b : 18;
    return { a, b };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    let a = Math.abs(typeof input.a === "number" ? input.a : 0);
    let b = Math.abs(typeof input.b === "number" ? input.b : 0);
    while (b) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return { result: a };
  }
}

// 23. LCM of Two Numbers
@Injectable()
export class MathLcmOracle extends BaseOracle {
  readonly key = "MATH_LCM_ORACLE";
  readonly name = "LCM of Two Numbers Oracle";
  readonly category = "MATH";
  readonly description = "Generates two integers (a, b) and computes Least Common Multiple.";
  readonly parameterSchema = {
    a: { type: "integer", min: 1, max: 200, default: 12 },
    b: { type: "integer", min: 1, max: 200, default: 18 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const a = typeof parameters.a === "number" ? parameters.a : 12;
    const b = typeof parameters.b === "number" ? parameters.b : 18;
    return { a, b };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const origA = Math.abs(typeof input.a === "number" ? input.a : 0);
    const origB = Math.abs(typeof input.b === "number" ? input.b : 0);
    if (origA === 0 || origB === 0) return { result: 0 };
    let a = origA, b = origB;
    while (b) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    const gcd = a;
    const lcm = (origA * origB) / gcd;
    return { result: lcm };
  }
}

// 24. Sum of Digits
@Injectable()
export class MathDigitSumOracle extends BaseOracle {
  readonly key = "MATH_DIGIT_SUM_ORACLE";
  readonly name = "Sum of Digits Oracle";
  readonly category = "MATH";
  readonly description = "Generates integer n input and computes the sum of its digits.";
  readonly parameterSchema = {
    n: { type: "integer", min: 10, max: 999999, default: 12345 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? parameters.n : 12345;
    return { n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const n = Math.abs(typeof input.n === "number" ? input.n : 0);
    const sum = String(n).split("").reduce((acc, char) => acc + parseInt(char, 10), 0);
    return { result: sum };
  }
}

// 25. Reverse a Number
@Injectable()
export class MathNumberReverseOracle extends BaseOracle {
  readonly key = "MATH_NUMBER_REVERSE_ORACLE";
  readonly name = "Reverse a Number Oracle";
  readonly category = "MATH";
  readonly description = "Generates integer n input and produces the digit-reversed integer.";
  readonly parameterSchema = {
    n: { type: "integer", min: 10, max: 999999, default: 98765 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? parameters.n : 98765;
    return { n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const rawN = typeof input.n === "number" ? input.n : 0;
    const sign = rawN < 0 ? -1 : 1;
    const reversedStr = String(Math.abs(rawN)).split("").reverse().join("");
    const result = sign * parseInt(reversedStr, 10);
    return { result };
  }
}

// 26. Count Digits
@Injectable()
export class MathDigitCountOracle extends BaseOracle {
  readonly key = "MATH_DIGIT_COUNT_ORACLE";
  readonly name = "Count Digits Oracle";
  readonly category = "MATH";
  readonly description = "Generates integer n input and counts the total number of digits.";
  readonly parameterSchema = {
    n: { type: "integer", min: 1, max: 9999999, default: 456789 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const n = typeof parameters.n === "number" ? parameters.n : 456789;
    return { n };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const n = Math.abs(typeof input.n === "number" ? input.n : 0);
    return { result: String(n).length };
  }
}

// 27. Binary Search
@Injectable()
export class BinarySearchOracle extends BaseOracle {
  readonly key = "BINARY_SEARCH_ORACLE";
  readonly name = "Binary Search Oracle";
  readonly category = "SEARCH";
  readonly description = "Generates a sorted array and target input, computing index via binary search.";
  readonly parameterSchema = {
    arraySize: { type: "integer", min: 5, max: 20, default: 6 },
    target: { type: "integer", min: 1, max: 100, default: 15 },
    minVal: { type: "integer", min: 1, max: 10, default: 1 },
    maxVal: { type: "integer", min: 20, max: 100, default: 100 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const arr = getArrayParam(parameters, "arr", 6).sort((a, b) => a - b);
    const target = typeof parameters.target === "number" ? parameters.target : (arr[1] ?? 10);
    return { arr, target };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = getArrayParam(input, "arr", 6);
    const target = typeof input.target === "number" ? input.target : 0;
    let low = 0, high = arr.length - 1, foundIndex = -1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (arr[mid] === target) {
        foundIndex = mid;
        break;
      } else if (arr[mid] < target) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return { result: foundIndex };
  }
}

// 28. Bubble Sort
@Injectable()
export class BubbleSortOracle extends BaseOracle {
  readonly key = "BUBBLE_SORT_ORACLE";
  readonly name = "Bubble Sort Oracle";
  readonly category = "SORT";
  readonly description = "Generates unsorted array input and returns sorted array as expected output.";
  readonly parameterSchema = {
    arraySize: { type: "integer", min: 3, max: 15, default: 5 },
    minVal: { type: "integer", min: 1, max: 10, default: 1 },
    maxVal: { type: "integer", min: 20, max: 100, default: 100 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    return { arr: getArrayParam(parameters, "arr", 5) };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = getArrayParam(input, "arr", 5);
    return { result: [...arr].sort((a, b) => a - b) };
  }
}

// 29. Selection Sort
@Injectable()
export class SelectionSortOracle extends BaseOracle {
  readonly key = "SELECTION_SORT_ORACLE";
  readonly name = "Selection Sort Oracle";
  readonly category = "SORT";
  readonly description = "Generates unsorted array input and returns sorted array as expected output.";
  readonly parameterSchema = {
    arraySize: { type: "integer", min: 3, max: 15, default: 5 },
    minVal: { type: "integer", min: 1, max: 10, default: 1 },
    maxVal: { type: "integer", min: 20, max: 100, default: 100 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    return { arr: getArrayParam(parameters, "arr", 5) };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = getArrayParam(input, "arr", 5);
    return { result: [...arr].sort((a, b) => a - b) };
  }
}

// 30. Merge Two Sorted Arrays
@Injectable()
export class MergeSortedArraysOracle extends BaseOracle {
  readonly key = "MERGE_SORTED_ARRAYS_ORACLE";
  readonly name = "Merge Two Sorted Arrays Oracle";
  readonly category = "SORT";
  readonly description = "Generates two sorted array inputs and merges them into a single sorted array.";
  readonly parameterSchema = {
    arraySize: { type: "integer", min: 2, max: 10, default: 4 },
    minVal: { type: "integer", min: 1, max: 10, default: 1 },
    maxVal: { type: "integer", min: 20, max: 100, default: 50 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const arr1 = getArrayParam(parameters, "arr1", 4).sort((a, b) => a - b);
    const arr2 = getArrayParam(parameters, "arr2", 4).map((x) => x + 2).sort((a, b) => a - b);
    return { arr1, arr2 };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr1 = getArrayParam(input, "arr1", 4);
    const arr2 = getArrayParam(input, "arr2", 4);
    const merged = [...arr1, ...arr2].sort((a, b) => a - b);
    return { result: merged };
  }
}

