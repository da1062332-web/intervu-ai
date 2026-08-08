import { Injectable } from "@nestjs/common";
import { BaseOracle } from "./base.oracle";

@Injectable()
export class ArrayRotationOracle extends BaseOracle {
  readonly key = "ARRAY_ROTATION_ORACLE";
  readonly name = "Array Rotation";
  readonly category = "ARRAY";
  readonly description = "Generates array rotation input and computes right-rotated expected output.";
  readonly parameterSchema = {
    arraySize: { type: "integer", min: 3, max: 15, default: 5 },
    k: { type: "integer", min: 1, max: 10, default: 2 },
    minVal: { type: "integer", min: 1, max: 10, default: 1 },
    maxVal: { type: "integer", min: 20, max: 100, default: 100 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const arraySize = typeof parameters.arraySize === "number" ? parameters.arraySize : 5;
    const k = typeof parameters.k === "number" ? parameters.k : 2;
    const minVal = typeof parameters.minVal === "number" ? parameters.minVal : 1;
    const maxVal = typeof parameters.maxVal === "number" ? parameters.maxVal : 100;

    const arr: number[] = [];
    for (let i = 0; i < arraySize; i++) {
      const val = minVal + (i * 3) % (maxVal - minVal + 1);
      arr.push(val);
    }

    return { arr, k };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const arr = Array.isArray(input.arr) ? [...input.arr] : [];
    const k = typeof input.k === "number" ? input.k : 0;

    if (arr.length === 0) {
      return { result: [] };
    }

    const effectiveK = ((k % arr.length) + arr.length) % arr.length;
    const rotated = [...arr.slice(arr.length - effectiveK), ...arr.slice(0, arr.length - effectiveK)];

    return { result: rotated };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (!Array.isArray(input.arr)) {
      errors.push("Input property 'arr' must be an array.");
    }
    if (typeof input.k !== "number") {
      errors.push("Input property 'k' must be a number.");
    }
    return errors;
  }

  override validateOutput(input: Record<string, any>, output: Record<string, any>): string[] {
    const errors = super.validateOutput(input, output);
    if (!Array.isArray(output.result)) {
      errors.push("Expected output property 'result' must be an array.");
    }
    return errors;
  }
}
