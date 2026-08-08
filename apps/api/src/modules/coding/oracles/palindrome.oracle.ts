import { Injectable } from "@nestjs/common";
import { BaseOracle } from "./base.oracle";

@Injectable()
export class PalindromeOracle extends BaseOracle {
  readonly key = "PALINDROME_ORACLE";
  readonly name = "Palindrome Oracle (Legacy)";
  readonly category = "STRING";
  readonly description = "Generates string input and checks palindrome validity as expected output.";
  readonly parameterSchema = {
    word: {
      type: "string",
      options: ["racecar", "level", "radar", "deified", "civic", "rotor", "hello", "world", "algorithm"],
      default: "racecar",
    },
  };

  generateInput(parameters: Record<string, any>): Record<string, any> {
    const word = typeof parameters.word === "string" ? parameters.word : "racecar";
    return { str: word };
  }

  generateExpectedOutput(input: Record<string, any>): Record<string, any> {
    const raw = typeof input.str === "string" ? input.str : typeof input.word === "string" ? input.word : "";
    const sanitized = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
    const reversed = sanitized.split("").reverse().join("");
    const isPalindrome = sanitized === reversed;

    return { isPalindrome, result: isPalindrome };
  }

  override validateInput(input: Record<string, any>): string[] {
    const errors = super.validateInput(input);
    if (typeof input.str !== "string" && typeof input.word !== "string") {
      errors.push("Input property 'str' or 'word' must be a string.");
    }
    return errors;
  }

  override validateOutput(input: Record<string, any>, output: Record<string, any>): string[] {
    const errors = super.validateOutput(input, output);
    if (typeof output.isPalindrome !== "boolean" && typeof output.result !== "boolean") {
      errors.push("Expected output property 'isPalindrome' or 'result' must be a boolean.");
    }
    return errors;
  }
}
