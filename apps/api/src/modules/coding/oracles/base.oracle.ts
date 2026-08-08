import { BaseOracle as IBaseOracle, OracleCategory } from "../interfaces/oracle.interface";

export abstract class BaseOracle implements IBaseOracle {
  abstract readonly key: string;
  abstract readonly name: string;
  readonly category: OracleCategory | string = "GENERAL";
  readonly description: string = "";
  readonly supportedDifficulties: string[] = ["EASY", "MEDIUM", "HARD"];
  readonly parameterSchema?: Record<string, any>;

  abstract generateInput(parameters: Record<string, any>): Record<string, any>;
  abstract generateExpectedOutput(input: Record<string, any>): Record<string, any>;

  validateInput(input: Record<string, any>): string[] {
    const errors: string[] = [];
    if (!input || typeof input !== "object") {
      errors.push("Input must be a valid object.");
    }
    return errors;
  }

  validateOutput(input: Record<string, any>, output: Record<string, any>): string[] {
    const errors: string[] = [];
    if (!output || typeof output !== "object") {
      errors.push("Expected output must be a valid object.");
    }
    return errors;
  }
}
