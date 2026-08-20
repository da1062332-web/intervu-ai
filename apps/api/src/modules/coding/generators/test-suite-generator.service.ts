import { Injectable } from "@nestjs/common";
import { BaseOracle } from "../interfaces/oracle.interface";
import { SeededPRNG } from "./seeded-parameter-generator.service";

export interface GeneratedTestCase {
  input: Record<string, any>;
  expectedOutput: Record<string, any>;
  isPublic: boolean;
  isStress: boolean;
  isBoundary: boolean;
  explanation?: string;
}

export interface GeneratedTestSuite {
  publicTests: GeneratedTestCase[];
  hiddenTests: GeneratedTestCase[];
  stressTests: GeneratedTestCase[];
  boundaryTests: GeneratedTestCase[];
}

export type GeneratorMode = "STANDARD" | "BOUNDARY" | "STRESS";

@Injectable()
export class TestSuiteGeneratorService {
  /**
   * Generates a complete test suite (Public, Hidden, Stress, Boundary) using stateless Oracle methods.
   * Guarantees 100% non-duplicate inputs, category-specific parameter variations, and deterministic generation.
   * Every generated test case independently generates a fresh, valid input from the resolved parameter schema/overrides,
   * without mutating or appending to the primary input, and recalculates expectedOutput from each test's own input.
   */
  generateTestSuite(
    oracle: BaseOracle,
    baseParameters: Record<string, any> = {},
    baseSeed: number = 42,
    parameterSchemaOverrides?: Record<string, any>,
  ): GeneratedTestSuite {
    const publicTests: GeneratedTestCase[] = [];
    const hiddenTests: GeneratedTestCase[] = [];
    const stressTests: GeneratedTestCase[] = [];
    const boundaryTests: GeneratedTestCase[] = [];

    const seenInputHashes = new Set<string>();

    // Combine parameter schema: oracle.parameterSchema + overrides + inferred from baseParameters
    const resolvedSchema = this.resolveParameterSchema(
      oracle.parameterSchema,
      parameterSchemaOverrides,
      baseParameters,
    );

    // Helper to generate a single unique test case
    const createTestCase = (
      mode: GeneratorMode,
      testIndex: number,
      categorySeedOffset: number,
      isPublic: boolean,
      isBoundary: boolean,
      isStress: boolean,
      explanation: string,
    ): GeneratedTestCase => {
      const testSeed = baseSeed + categorySeedOffset + testIndex * 137;
      const { input, expectedOutput } = this.generateUniqueInputAndOutput(
        oracle,
        resolvedSchema,
        baseParameters,
        testSeed,
        mode,
        seenInputHashes,
      );

      return {
        input,
        expectedOutput,
        isPublic,
        isBoundary,
        isStress,
        explanation,
      };
    };

    // 1. Primary Public Test Case (Standard sample)
    publicTests.push(
      createTestCase("STANDARD", 0, 100, true, false, false, "Primary public sample test case generated from pattern parameters."),
    );

    // 2. Secondary Public Test Case (Standard varied sample)
    publicTests.push(
      createTestCase("STANDARD", 1, 150, true, false, false, "Secondary public sample test case with varied parameters."),
    );

    // 3. Hidden Tests (3 distinct evaluation test cases)
    for (let i = 0; i < 3; i++) {
      hiddenTests.push(
        createTestCase("STANDARD", i, 200, false, false, false, `Hidden evaluation test case #${i + 1}.`),
      );
    }

    // 4. Boundary Test Case (Minimal / edge-case parameter values)
    boundaryTests.push(
      createTestCase("BOUNDARY", 0, 300, false, true, false, "Boundary condition test case (minimal/edge input values)."),
    );

    // 5. Stress Test Case (Large input / heavy load parameters)
    stressTests.push(
      createTestCase("STRESS", 0, 400, false, false, true, "Stress load test case (large bounds input)."),
    );

    return {
      publicTests,
      hiddenTests,
      stressTests,
      boundaryTests,
    };
  }

  private generateUniqueInputAndOutput(
    oracle: BaseOracle,
    schema: Record<string, any>,
    baseParams: Record<string, any>,
    initialSeed: number,
    mode: GeneratorMode,
    seenHashes: Set<string>,
  ): { input: Record<string, any>; expectedOutput: Record<string, any> } {
    let attempts = 0;
    const maxAttempts = 200;
    let currentSeed = initialSeed;

    while (attempts < maxAttempts) {
      attempts++;
      const prng = new SeededPRNG(currentSeed);
      const generatedParams = this.generateParamsForMode(
        schema,
        baseParams,
        prng,
        mode,
        attempts,
      );

      const input = oracle.generateInput(generatedParams);
      const hash = this.hashInput(input);

      if (!seenHashes.has(hash)) {
        const validationErrors = oracle.validateInput ? oracle.validateInput(input) : [];
        if (validationErrors.length === 0 || mode !== "BOUNDARY") {
          seenHashes.add(hash);
          const expectedOutput = oracle.generateExpectedOutput(input);
          return { input, expectedOutput };
        }
      }

      currentSeed = initialSeed + attempts * 1009 + attempts * 31;
    }

    throw new Error(
      `Failed to generate unique input for oracle ${oracle.key} under mode ${mode} after ${maxAttempts} attempts.`,
    );
  }

  private generateParamsForMode(
    schema: Record<string, any>,
    baseParams: Record<string, any>,
    prng: SeededPRNG,
    mode: GeneratorMode,
    attempt: number,
  ): Record<string, any> {
    const result: Record<string, any> = {};
    const keys = new Set([...Object.keys(schema), ...Object.keys(baseParams)]);

    for (const key of keys) {
      const spec = schema[key] || {};
      const baseVal = baseParams[key];
      const type = (spec.type || this.inferType(baseVal, key)).toLowerCase();

      switch (type) {
        case "integer":
        case "int": {
          const defaultMin = typeof baseVal === "number" ? Math.max(1, Math.floor(baseVal / 5)) : 1;
          const defaultMax = typeof baseVal === "number" ? Math.max(100, baseVal * 2) : 100;
          let min = typeof spec.min === "number" ? spec.min : defaultMin;
          let max = typeof spec.max === "number" ? spec.max : defaultMax;
          if (min > max) [min, max] = [max, min];

          if (mode === "BOUNDARY") {
            if (key === "marks" || key === "score") {
              const boundaryMarks = [0, 59, 60, 69, 70, 79, 80, 89, 90, 100, 50, 85].filter((v) => v >= min && v <= max);
              result[key] = boundaryMarks.length > 0 ? boundaryMarks[(attempt - 1) % boundaryMarks.length] : min;
            } else if (key === "k") {
              result[key] = Math.min(max, Math.max(min, min + ((attempt - 1) % 3)));
            } else {
              result[key] = Math.min(max, min + ((attempt - 1) % Math.max(1, max - min + 1)));
            }
          } else if (mode === "STRESS") {
            const stressMax = max;
            const span = Math.max(1, max - min + 1);
            result[key] = Math.max(min, stressMax - ((attempt - 1) % Math.min(span, 10)));
          } else {
            // STANDARD mode: vary parameters using PRNG within [min, max]
            result[key] = prng.nextInt(min, max);
          }
          break;
        }

        case "float":
        case "number": {
          const min = typeof spec.min === "number" ? spec.min : 0.0;
          const max = typeof spec.max === "number" ? spec.max : 100.0;
          const decimals = typeof spec.decimals === "number" ? spec.decimals : 2;

          if (mode === "BOUNDARY") {
            const val = min + ((attempt - 1) * 0.1);
            result[key] = parseFloat(val.toFixed(decimals));
          } else if (mode === "STRESS") {
            const val = max - ((attempt - 1) * 0.1);
            result[key] = parseFloat(val.toFixed(decimals));
          } else {
            const val = prng.nextFloat() * (max - min) + min;
            result[key] = parseFloat(val.toFixed(decimals));
          }
          break;
        }

        case "boolean": {
          if (mode === "BOUNDARY") {
            result[key] = attempt % 2 === 1 ? false : true;
          } else if (mode === "STRESS") {
            result[key] = attempt % 2 === 1 ? true : false;
          } else {
            result[key] = prng.nextFloat() > 0.5;
          }
          break;
        }

        case "enum":
        case "choice": {
          const options = Array.isArray(spec.options) ? spec.options : [];
          if (options.length > 0) {
            if (mode === "BOUNDARY") {
              result[key] = options[(attempt - 1) % options.length];
            } else if (mode === "STRESS") {
              result[key] = options[(options.length - 1 - (attempt - 1)) % options.length];
            } else {
              result[key] = prng.choice(options);
            }
          } else {
            result[key] = baseVal ?? null;
          }
          break;
        }

        case "string": {
          const wordSamples = [
            "hello", "world", "racecar", "level", "radar", "deified", "civic",
            "algorithm", "python", "matrix", "kayak", "madam", "rotor", "noon", "reviver"
          ];

          if (mode === "BOUNDARY") {
            const minLen = typeof spec.minLength === "number" ? spec.minLength : 1;
            const options = Array.isArray(spec.options) ? spec.options : [];
            if (options.length > 0 && attempt <= options.length) {
              result[key] = options[attempt - 1];
            } else if (attempt === 1 && minLen === 0) {
              result[key] = "";
            } else if (attempt === 1) {
              result[key] = "a".repeat(minLen);
            } else {
              const sampleIndex = (attempt - 1) % wordSamples.length;
              result[key] = wordSamples[sampleIndex];
            }
          } else if (mode === "STRESS") {
            const maxLen = typeof spec.maxLength === "number" ? spec.maxLength : 50;
            const char = key === "word" || key === "str" ? "a" : "x";
            const len = Math.max(5, maxLen - ((attempt - 1) % 5));
            result[key] = char.repeat(len) + (attempt > 1 ? String(attempt) : "");
          } else {
            if (Array.isArray(spec.options) && spec.options.length > 0) {
              result[key] = prng.choice(spec.options);
            } else {
              result[key] = prng.choice(wordSamples);
            }
          }
          break;
        }

        case "array":
        case "list": {
          const minLen = typeof spec.minLength === "number" ? spec.minLength : 2;
          const maxLen = typeof spec.maxLength === "number" ? spec.maxLength : 20;
          const itemMin = typeof spec.min === "number" ? spec.min : 1;
          const itemMax = typeof spec.max === "number" ? spec.max : 100;

          let targetLen = 5;
          if (mode === "BOUNDARY") {
            targetLen = Math.max(1, minLen + ((attempt - 1) % 3));
          } else if (mode === "STRESS") {
            targetLen = Math.max(5, maxLen - ((attempt - 1) % 5));
          } else {
            targetLen = prng.nextInt(minLen, Math.min(maxLen, 12));
          }

          const arr: number[] = [];
          for (let idx = 0; idx < targetLen; idx++) {
            const val = mode === "BOUNDARY"
              ? itemMin + ((idx + attempt - 1) % 5)
              : mode === "STRESS"
                ? itemMax - ((idx + attempt - 1) % 5)
                : prng.nextInt(itemMin, itemMax);
            arr.push(val);
          }
          result[key] = arr;
          break;
        }

        default:
          result[key] = baseVal !== undefined ? baseVal : null;
      }
    }

    return result;
  }

  private hashInput(input: Record<string, any>): string {
    if (!input || typeof input !== "object") {
      return String(input);
    }
    const sortObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(sortObject);
      } else if (obj !== null && typeof obj === "object") {
        return Object.keys(obj)
          .sort()
          .reduce((acc: Record<string, any>, k: string) => {
            acc[k] = sortObject(obj[k]);
            return acc;
          }, {});
      }
      return obj;
    };
    return JSON.stringify(sortObject(input));
  }

  private resolveParameterSchema(
    oracleSchema?: Record<string, any>,
    overrideSchema?: Record<string, any>,
    baseParameters?: Record<string, any>,
  ): Record<string, any> {
    const combined: Record<string, any> = {
      ...(oracleSchema || {}),
      ...(overrideSchema || {}),
    };

    if (baseParameters && typeof baseParameters === "object") {
      for (const [key, val] of Object.entries(baseParameters)) {
        if (!combined[key]) {
          combined[key] = {
            type: this.inferType(val, key),
            default: val,
          };
        }
      }
    }

    return combined;
  }

  private inferType(val: any, key: string): string {
    if (typeof val === "number") {
      return Number.isInteger(val) ? "integer" : "float";
    }
    if (typeof val === "boolean") return "boolean";
    if (typeof val === "string") return "string";
    if (Array.isArray(val)) return "array";
    if (key === "n" || key === "num" || key === "val" || key === "k" || key === "arraySize") return "integer";
    if (key === "word" || key === "str" || key === "text") return "string";
    if (key === "arr" || key === "nums" || key === "array") return "array";
    return "string";
  }
}
