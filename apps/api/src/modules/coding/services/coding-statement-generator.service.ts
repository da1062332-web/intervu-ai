import { Injectable, Inject, Optional } from "@nestjs/common";
import { CodingPattern } from "@prisma/client";
import { PatternExecutionResultPayload } from "./pattern-execution.service";

export interface AIStatementResult {
  title: string;
  narrative: string;
  constraintsDescription: string;
}

@Injectable()
export class CodingStatementGeneratorService {
  constructor(
    @Optional() @Inject("LLM_ADAPTER") private readonly llmAdapter?: { generate(prompt: string): Promise<string> },
  ) {}

  /**
   * Generates or polishes the problem statement narrative using the AI service layer.
   * STRICT GUARANTEE: AI only provides narrative text; inputs, outputs, and test cases
   * are 100% determined by the Oracle and cannot be modified by AI.
   */
  async generateStatement(
    pattern: CodingPattern,
    executionResult: PatternExecutionResultPayload,
  ): Promise<AIStatementResult> {
    const oracleKey = (pattern.oracleKey || "").toUpperCase();
    const defaultTitle = pattern.title || "Coding Challenge";

    let defaultNarrative = "";
    let defaultConstraints = "Follow standard time O(N) and space O(1) efficiency guidelines.";

    if (oracleKey === "MATH_PRIME_CHECK_ORACLE" || oracleKey.includes("PRIME")) {
      const sampleN = executionResult.generatedInput?.n ?? 29;
      const sampleRes = executionResult.expectedOutput?.result ?? true;
      defaultNarrative = `Write a function to determine if a given integer \`n\` is a prime number.

A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself.

### Function Signature
\`isPrime(n)\`

### Input
- \`n\`: An integer value.

### Output
- Returns \`true\` if \`n\` is prime, otherwise returns \`false\`.

### Example Walkthrough
- Input: \`n = ${sampleN}\`
- Output: \`${sampleRes}\``;
      defaultConstraints = "2 <= n <= 10^6. Time Complexity: O(sqrt(N)), Space Complexity: O(1).";
    } else if (oracleKey === "ARRAY_ROTATION_ORACLE" || oracleKey.includes("ROTAT")) {
      const sampleArr = JSON.stringify(executionResult.generatedInput?.arr || [1, 2, 3, 4, 5]);
      const sampleK = executionResult.generatedInput?.k ?? 2;
      const sampleRes = JSON.stringify(executionResult.expectedOutput?.result || [4, 5, 1, 2, 3]);
      defaultNarrative = `Write a function to rotate an array of integers \`arr\` to the right by \`k\` steps.

### Function Signature
\`rotate(arr, k)\`

### Input
- \`arr\`: An array of integers.
- \`k\`: An integer representing the rotation count.

### Output
- Returns the array rotated right by \`k\` steps.

### Example Walkthrough
- Input: \`arr = ${sampleArr}, k = ${sampleK}\`
- Output: \`${sampleRes}\``;
      defaultConstraints = "1 <= arr.length <= 10^5, 0 <= k <= 10^5. Time Complexity: O(N), Space Complexity: O(1).";
    } else {
      defaultNarrative =
        pattern.description ||
        `Write a function to process the input parameters and return the result matching the problem specification.

### Sample Input
${JSON.stringify(executionResult.generatedInput)}

### Expected Output
${JSON.stringify(executionResult.expectedOutput)}`;
    }

    if (!this.llmAdapter) {
      return {
        title: defaultTitle,
        narrative: defaultNarrative,
        constraintsDescription: defaultConstraints,
      };
    }

    try {
      const prompt = `You are an expert technical interviewer writing a coding problem statement.
Problem Title: ${pattern.title}
Pattern Oracle Key: ${pattern.oracleKey}
Sample Input: ${JSON.stringify(executionResult.generatedInput)}

Generate JSON with fields:
{
  "title": "A compelling title",
  "narrative": "A clear problem description explaining what function to implement and what output is expected.",
  "constraintsDescription": "Input bounds and constraints."
}`;

      const responseText = await this.llmAdapter.generate(prompt);
      const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanedJson);

      return {
        title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : defaultTitle,
        narrative: typeof parsed.narrative === "string" && parsed.narrative.trim() ? parsed.narrative.trim() : defaultNarrative,
        constraintsDescription: typeof parsed.constraintsDescription === "string" && parsed.constraintsDescription.trim() ? parsed.constraintsDescription.trim() : defaultConstraints,
      };
    } catch {
      // Fallback to pattern default values on AI failure/timeout/invalid format
      return {
        title: defaultTitle,
        narrative: defaultNarrative,
        constraintsDescription: defaultConstraints,
      };
    }
  }
}
