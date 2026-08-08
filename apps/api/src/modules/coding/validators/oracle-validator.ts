import { Injectable } from "@nestjs/common";
import { BaseOracle } from "../interfaces/oracle.interface";

@Injectable()
export class OracleValidator {
  validate(
    oracle: BaseOracle,
    input: Record<string, any>,
    output: Record<string, any>,
  ): string[] {
    const errors: string[] = [];

    if (!oracle) {
      errors.push("Oracle instance is missing.");
      return errors;
    }

    if (typeof oracle.validateInput === "function") {
      errors.push(...oracle.validateInput(input));
    }

    if (typeof oracle.validateOutput === "function") {
      errors.push(...oracle.validateOutput(input, output));
    }

    return errors;
  }
}
