import { Injectable } from "@nestjs/common";
import { BaseOracle } from "./base.oracle";

export interface GradeThresholds {
  A: number;
  B: number;
  C: number;
  D: number;
}

@Injectable()
export class BasicGradeCalculatorOracle extends BaseOracle {
  readonly key = "BASIC_GRADE_CALCULATOR_ORACLE";
  readonly name = "Basic Grade Calculator";
  readonly category = "BASIC";
  readonly description =
    "Calculates a student's grade from marks using configurable grading thresholds.";
  readonly supportedDifficulties = ["EASY"];

  readonly parameterSchema = {
    marks: { type: "integer", min: 0, max: 100, default: 85 },
    aThreshold: { type: "integer", min: 0, max: 100, default: 90 },
    bThreshold: { type: "integer", min: 0, max: 100, default: 80 },
    cThreshold: { type: "integer", min: 0, max: 100, default: 70 },
    dThreshold: { type: "integer", min: 0, max: 100, default: 60 },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const marks = typeof parameters.marks === "number" ? parameters.marks : 85;
    const a = typeof parameters.aThreshold === "number" ? parameters.aThreshold : 90;
    const b = typeof parameters.bThreshold === "number" ? parameters.bThreshold : 80;
    const c = typeof parameters.cThreshold === "number" ? parameters.cThreshold : 70;
    const d = typeof parameters.dThreshold === "number" ? parameters.dThreshold : 60;

    const validOrder = a > b && b > c && c > d && a <= 100 && d >= 0;
    const thresholds: GradeThresholds = validOrder
      ? { A: a, B: b, C: c, D: d }
      : { A: 90, B: 80, C: 70, D: 60 };

    return {
      marks,
      thresholds,
    };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const marks = typeof input.marks === "number" ? input.marks : 0;
    const thresholds: GradeThresholds = {
      A: typeof input.thresholds?.A === "number" ? input.thresholds.A : 90,
      B: typeof input.thresholds?.B === "number" ? input.thresholds.B : 80,
      C: typeof input.thresholds?.C === "number" ? input.thresholds.C : 70,
      D: typeof input.thresholds?.D === "number" ? input.thresholds.D : 60,
    };

    let grade = "F";
    if (marks >= thresholds.A) {
      grade = "A";
    } else if (marks >= thresholds.B) {
      grade = "B";
    } else if (marks >= thresholds.C) {
      grade = "C";
    } else if (marks >= thresholds.D) {
      grade = "D";
    } else {
      grade = "F";
    }

    return { grade, result: grade };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);

    if (input.marks === undefined || input.marks === null) {
      errors.push("Input property 'marks' is required.");
      return errors;
    }

    if (typeof input.marks !== "number" || Number.isNaN(input.marks)) {
      errors.push("Input property 'marks' must be a valid number.");
      return errors;
    }

    if (input.marks < 0 || input.marks > 100) {
      errors.push("Input property 'marks' must be between 0 and 100 inclusive.");
    }

    if (input.thresholds && typeof input.thresholds === "object") {
      const { A, B, C, D } = input.thresholds;
      if (
        typeof A === "number" &&
        typeof B === "number" &&
        typeof C === "number" &&
        typeof D === "number"
      ) {
        if (!(A > B && B > C && C > D)) {
          errors.push("Thresholds must strictly satisfy A > B > C > D.");
        }
      }
    }

    return errors;
  }

  override validateOutput(input: Record<string, any>, output: Record<string, any>): string[] {
    const errors = super.validateOutput(input, output);
    if (typeof output.grade !== "string" || !["A", "B", "C", "D", "F"].includes(output.grade)) {
      errors.push("Expected output property 'grade' must be one of ['A', 'B', 'C', 'D', 'F'].");
    }
    return errors;
  }
}
