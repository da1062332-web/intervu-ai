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

@Injectable()
export class TestSuiteGeneratorService {
  /**
   * Generates a complete test suite (Public, Hidden, Stress, Boundary) using stateless Oracle methods.
   * Guarantees non-duplicate inputs, category-specific parameter variations, and deterministic generation.
   */
  generateTestSuite(
    oracle: BaseOracle,
    parameters: Record<string, any>,
    baseSeed: number = 42,
  ): GeneratedTestSuite {
    const publicTests: GeneratedTestCase[] = [];
    const hiddenTests: GeneratedTestCase[] = [];
    const stressTests: GeneratedTestCase[] = [];
    const boundaryTests: GeneratedTestCase[] = [];

    const seenInputHashes = new Set<string>();

    const hashInput = (input: Record<string, any>): string => {
      try {
        return JSON.stringify(input);
      } catch {
        return String(input);
      }
    };

    // 1. Primary Public Test (Sample input generated from base parameters)
    const primaryInput = oracle.generateInput(parameters);
    const primaryOutput = oracle.generateExpectedOutput(primaryInput);
    const primaryHash = hashInput(primaryInput);
    seenInputHashes.add(primaryHash);

    publicTests.push({
      input: primaryInput,
      expectedOutput: primaryOutput,
      isPublic: true,
      isStress: false,
      isBoundary: false,
      explanation: "Primary public sample test case generated from pattern parameters.",
    });

    // 2. Secondary Public Test (Vary parameters with seed offset)
    const public2Params = this.generateVariedParams(oracle, parameters, baseSeed + 101, "STANDARD");
    const public2Input = this.generateUniqueInput(oracle, public2Params, baseSeed + 102, seenInputHashes, "STANDARD");
    const public2Output = oracle.generateExpectedOutput(public2Input);
    publicTests.push({
      input: public2Input,
      expectedOutput: public2Output,
      isPublic: true,
      isStress: false,
      isBoundary: false,
      explanation: "Secondary public sample test case with varied parameters.",
    });

    // 3. Hidden Tests (3 distinct variants)
    for (let i = 0; i < 3; i++) {
      const hiddenParams = this.generateVariedParams(oracle, parameters, baseSeed + 201 + i * 37, "STANDARD");
      const hiddenInput = this.generateUniqueInput(oracle, hiddenParams, baseSeed + 250 + i * 37, seenInputHashes, "STANDARD");
      const hiddenOutput = oracle.generateExpectedOutput(hiddenInput);

      hiddenTests.push({
        input: hiddenInput,
        expectedOutput: hiddenOutput,
        isPublic: false,
        isStress: false,
        isBoundary: false,
        explanation: `Hidden evaluation test case #${i + 1}.`,
      });
    }

    // 4. Boundary Test (Minimal / Edge-case input)
    const boundaryParams = this.generateVariedParams(oracle, parameters, baseSeed + 301, "BOUNDARY");
    const boundaryInput = this.generateUniqueInput(oracle, boundaryParams, baseSeed + 302, seenInputHashes, "BOUNDARY");
    const boundaryOutput = oracle.generateExpectedOutput(boundaryInput);
    boundaryTests.push({
      input: boundaryInput,
      expectedOutput: boundaryOutput,
      isPublic: false,
      isStress: false,
      isBoundary: true,
      explanation: "Boundary condition test case (minimal/edge input values).",
    });

    // 5. Stress Test (Large input / Heavy load)
    const stressParams = this.generateVariedParams(oracle, parameters, baseSeed + 401, "STRESS");
    const stressInput = this.generateUniqueInput(oracle, stressParams, baseSeed + 402, seenInputHashes, "STRESS");
    const stressOutput = oracle.generateExpectedOutput(stressInput);
    stressTests.push({
      input: stressInput,
      expectedOutput: stressOutput,
      isPublic: false,
      isStress: true,
      isBoundary: false,
      explanation: "Stress load test case (large bounds input).",
    });

    return {
      publicTests,
      hiddenTests,
      stressTests,
      boundaryTests,
    };
  }

  private generateVariedParams(
    oracle: BaseOracle,
    baseParams: Record<string, any>,
    seed: number,
    mode: "STANDARD" | "BOUNDARY" | "STRESS",
  ): Record<string, any> {
    const prng = new SeededPRNG(seed);
    const varied: Record<string, any> = { ...baseParams };
    const schema = oracle.parameterSchema || {};

    if (mode === "BOUNDARY") {
      for (const key of Object.keys(varied)) {
        if (typeof varied[key] === "number") {
          const specMin = schema[key]?.min;
          varied[key] = typeof specMin === "number" ? specMin : key === "n" || key === "num" || key === "val" ? 2 : 1;
        } else if (typeof varied[key] === "string") {
          varied[key] = "a";
        }
      }
      if (schema.n) varied.n = schema.n.min ?? 2;
      if (schema.arraySize) varied.arraySize = schema.arraySize.min ?? 2;
      if (schema.k) varied.k = schema.k.min ?? 0;
      if (varied.n === undefined && typeof baseParams.n === "number") varied.n = 2;
      if (varied.arraySize === undefined && typeof baseParams.arraySize === "number") varied.arraySize = 2;
      if (varied.k === undefined && typeof baseParams.k === "number") varied.k = 0;
      if (varied.word === undefined && typeof baseParams.word === "string") varied.word = "a";
      return varied;
    }

    if (mode === "STRESS") {
      for (const key of Object.keys(varied)) {
        if (typeof varied[key] === "number") {
          const specMax = schema[key]?.max;
          varied[key] = typeof specMax === "number" ? specMax : key === "n" || key === "num" ? 9973 : 100;
        } else if (typeof varied[key] === "string") {
          varied[key] = "a".repeat(50);
        }
      }
      if (schema.n) varied.n = schema.n.max ?? 9973;
      if (schema.arraySize) varied.arraySize = schema.arraySize.max ?? 100;
      if (schema.k) varied.k = schema.k.max ?? 50;
      if (varied.n === undefined && typeof baseParams.n === "number") varied.n = 9973;
      if (varied.arraySize === undefined && typeof baseParams.arraySize === "number") varied.arraySize = 100;
      if (varied.k === undefined && typeof baseParams.k === "number") varied.k = 50;
      if (varied.word === undefined && typeof baseParams.word === "string") varied.word = "a".repeat(50);
      return varied;
    }

    // Standard Mode: generate varied parameters using PRNG
    const primeSamples = [2, 3, 4, 5, 7, 10, 11, 15, 17, 21, 29, 31, 42, 50, 73, 89, 97];
    const wordSamples = ["hello", "world", "racecar", "level", "radar", "deified", "civic", "algorithm", "python", "matrix"];

    for (const key of Object.keys(varied)) {
      if (key === "n" || key === "num" || key === "val") {
        varied[key] = prng.choice(primeSamples);
      } else if (key === "arraySize") {
        varied[key] = prng.nextInt(3, 12);
      } else if (key === "k") {
        varied[key] = prng.nextInt(1, 8);
      } else if (key === "word" || key === "str" || key === "text") {
        varied[key] = prng.choice(wordSamples);
      } else if (typeof varied[key] === "number") {
        varied[key] = prng.nextInt(1, 100);
      }
    }

    return varied;
  }

  private generateUniqueInput(
    oracle: BaseOracle,
    initialParams: Record<string, any>,
    seed: number,
    seenHashes: Set<string>,
    mode: "STANDARD" | "BOUNDARY" | "STRESS" = "STANDARD",
  ): Record<string, any> {
    let currentParams = { ...initialParams };
    let input = oracle.generateInput(currentParams);
    let hash = JSON.stringify(input);
    let attempts = 0;

    while (seenHashes.has(hash) && attempts < 25) {
      attempts++;
      const offsetSeed = seed + attempts * 19;
      currentParams = this.generateVariedParams(oracle, currentParams, offsetSeed, mode);
      input = oracle.generateInput(currentParams);
      hash = JSON.stringify(input);
    }

    seenHashes.add(hash);
    return input;
  }
}
