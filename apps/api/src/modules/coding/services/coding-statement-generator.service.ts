import { Injectable, Inject, Optional } from "@nestjs/common";
import { CodingPattern } from "@prisma/client";
import { PatternExecutionResultData } from "./pattern-execution.service";
import { OracleRegistry } from "../oracles/oracle.registry";

export interface AIStatementResult {
  title: string;
  narrative: string;
  constraintsDescription: string;
}

@Injectable()
export class CodingStatementGeneratorService {
  constructor(
    @Optional()
    @Inject("LLM_ADAPTER")
    private readonly llmAdapter?: { generate(prompt: string): Promise<string> },
    private readonly oracleRegistry?: OracleRegistry,
  ) {}

  /**
   * Generates a polished, LeetCode-style problem statement narrative formatted per difficulty.
   * Uses structured Markdown with code pills, example walkthroughs, and constraints.
   */
  async generateStatement(
    pattern: CodingPattern,
    executionResult: PatternExecutionResultData,
  ): Promise<AIStatementResult> {
    const oracleKey = (pattern.oracleKey || "").toUpperCase();
    const difficulty = (pattern.difficulty || "EASY").toUpperCase();
    const defaultTitle = pattern.title || this.getOracleTitle(oracleKey);

    // 0. Check if a statement was already generated and saved in pattern.statementSpecification
    const spec = (pattern.statementSpecification as Record<string, any>) || {};
    const existingNarrative = spec.narrative || spec.problemStatement || (pattern.metadata as Record<string, any>)?.narrative;
    if (existingNarrative) {
      return {
        title: defaultTitle,
        narrative: this.sanitizeNarrative(existingNarrative),
        constraintsDescription: spec.constraintsDescription || this.getDifficultyConstraints(difficulty),
      };
    }

    // 1. Check for specific high-quality statement formatters (e.g. BASIC_GRADE_CALCULATOR_ORACLE)
    const specificNarrative = this.generateSpecificOracleNarrative(
      oracleKey,
      difficulty,
      executionResult,
    );

    if (specificNarrative) {
      return {
        title: defaultTitle,
        narrative: this.sanitizeNarrative(specificNarrative.narrative),
        constraintsDescription: specificNarrative.constraintsDescription,
      };
    }

    // 2. Generate structured fallback narrative adaptive to difficulty
    const defaultNarrative = this.buildStructuredNarrative(
      pattern,
      oracleKey,
      difficulty,
      executionResult,
    );
    const defaultConstraints = this.getDifficultyConstraints(difficulty);

    if (!this.llmAdapter) {
      return {
        title: defaultTitle,
        narrative: this.sanitizeNarrative(defaultNarrative),
        constraintsDescription: defaultConstraints,
      };
    }

    try {
      const formattedInput = this.formatNormalInput(executionResult.generatedInput);
      const formattedOutput = this.formatNormalOutput(executionResult.expectedOutput);

      const prompt = `You are an expert technical interviewer writing a coding problem statement in standard competitive programming format (like LeetCode or HackerRank).
Problem Title: ${defaultTitle}
Difficulty Level: ${difficulty}
Pattern Oracle Key: ${oracleKey}
Parameter Schema: ${JSON.stringify(pattern.parameterSchema)}
Sample Input: ${formattedInput}
Expected Output: ${formattedOutput}

CRITICAL FORMAT RULES FOR EXAMPLES:
- NEVER format Input or Output as raw JSON objects like {"a": 12, "b": 8} or {"result": 20}.
- Format Input as clean variable assignments, e.g. "a = 12, b = 8" or "nums = [2, 7, 11, 15], target = 9".
- Format Output as the exact normal expected value without JSON wrapper objects, e.g. "20" or "[0, 1]" or "true".
- Every example MUST follow this exact structure:
  #### Example 1
  **Input:** \`[formatted input]\`
  **Output:** \`[formatted output]\`
  **Explanation:** [walkthrough]

Generate JSON with fields:
{
  "title": "${defaultTitle}",
  "narrative": "A complete problem statement formatted in clean markdown. Structure as:\\n### Problem Statement\\n[Problem description]\\n\\n### Examples\\n#### Example 1\\n**Input:** \`[sample input]\`\\n**Output:** \`[sample output]\`\\n**Explanation:** [walkthrough]\\n\\n#### Example 2\\n**Input:** \`[sample input 2]\`\\n**Output:** \`[sample output 2]\`\\n**Explanation:** [walkthrough 2]\\n\\n### Constraints\\n- [Constraint 1]\\n- [Constraint 2]",
  "constraintsDescription": "Input bounds and complexity constraints for ${difficulty} difficulty."
}`;

      const responseText = await this.llmAdapter.generate(prompt);
      const cleanedJson = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleanedJson);

      return {
        title:
          typeof parsed.title === "string" && parsed.title.trim()
            ? parsed.title.trim()
            : defaultTitle,
        narrative:
          typeof parsed.narrative === "string" && parsed.narrative.trim()
            ? this.sanitizeNarrative(parsed.narrative.trim())
            : this.sanitizeNarrative(defaultNarrative),
        constraintsDescription:
          typeof parsed.constraintsDescription === "string" &&
          parsed.constraintsDescription.trim()
            ? parsed.constraintsDescription.trim()
            : defaultConstraints,
      };
    } catch {
      return {
        title: defaultTitle,
        narrative: this.sanitizeNarrative(defaultNarrative),
        constraintsDescription: defaultConstraints,
      };
    }
  }

  private generateSpecificOracleNarrative(
    oracleKey: string,
    difficulty: string,
    executionResult: PatternExecutionResultData,
  ): { narrative: string; constraintsDescription: string } | null {
    if (oracleKey === "BASIC_GRADE_CALCULATOR_ORACLE") {
      const sampleInput = executionResult.generatedInput;
      const sampleMarks =
        typeof sampleInput?.marks === "number" ? sampleInput.marks : 85;

      let sampleGrade = "B";
      if (sampleMarks >= 90) sampleGrade = "A";
      else if (sampleMarks >= 80) sampleGrade = "B";
      else if (sampleMarks >= 70) sampleGrade = "C";
      else if (sampleMarks >= 60) sampleGrade = "D";
      else sampleGrade = "F";

      const narrative = `### Problem Statement
Write a program/function \`calculateGrade\` that takes an integer \`marks\` (ranging from \`0\` to \`100\`) representing a student's test score, and returns the corresponding letter grade based on the following grading scale:

| Marks Range | Letter Grade |
| \`90\` to \`100\` | \`'A'\` |
| \`80\` to \`89\` | \`'B'\` |
| \`70\` to \`79\` | \`'C'\` |
| \`60\` to \`69\` | \`'D'\` |
| \`0\` to \`59\` | \`'F'\` |

---

### Examples

#### Example 1
- **Input**: \`marks = ${sampleMarks}\`
- **Output**: \`"${sampleGrade}"\`
- **Explanation**: \`${sampleMarks}\` falls in the specified range, so the grade is \`'${sampleGrade}'\`.

#### Example 2
- **Input**: \`marks = 92\`
- **Output**: \`"A"\`
- **Explanation**: \`92\` is greater than or equal to \`90\`, so the grade is \`'A'\`.

---

### Constraints
- \`0 <= marks <= 100\`
- \`marks\` is an integer.`;

      return {
        narrative,
        constraintsDescription: "0 <= marks <= 100",
      };
    }

    return null;
  }

  private buildStructuredNarrative(
    pattern: CodingPattern,
    oracleKey: string,
    difficulty: string,
    executionResult: PatternExecutionResultData,
  ): string {
    let oracleDesc = pattern.description || "process the input parameters and return the expected output";

    if (this.oracleRegistry && oracleKey) {
      try {
        const oracle = this.oracleRegistry.getOracle(oracleKey);
        if (oracle.description) {
          oracleDesc = oracle.description;
        }
      } catch (e) {
        // Fallback if oracle is not found in registry
      }
    }

    const inpStr = this.formatNormalInput(executionResult.generatedInput);
    const outStr = this.formatNormalOutput(executionResult.expectedOutput);

    const complexityHint =
      difficulty === "HARD"
        ? "\n\n*Note*: Optimize your solution for time complexity $O(N)$ and space complexity $O(1)$."
        : difficulty === "MEDIUM"
          ? "\n\n*Note*: Aim for a time complexity of $O(N)$ or $O(N \\log N)$."
          : "";

    return `### Problem Statement
Write a function to ${oracleDesc}.${complexityHint}

---

### Examples

#### Example 1
**Input:** \`${inpStr}\`
**Output:** \`${outStr}\`
**Explanation:** Generates the expected result matching the problem specification.

---

### Constraints
- Parameter inputs satisfy schema boundaries.
- Efficiency expectation: ${this.getDifficultyConstraints(difficulty)}`;
  }

  private getDifficultyConstraints(difficulty: string): string {
    switch (difficulty) {
      case "EASY":
        return "Time Complexity: O(N), Space Complexity: O(1)";
      case "MEDIUM":
        return "Time Complexity: O(N) or O(N log N), Space Complexity: O(1)";
      case "HARD":
        return "Time Complexity: O(N), Space Complexity: O(1) auxiliary space";
      default:
        return "Time Complexity: O(N), Space Complexity: O(1)";
    }
  }

  private getOracleTitle(oracleKey: string): string {
    if (!oracleKey) return "Coding Challenge";
    const formatted = oracleKey
      .replace(/_ORACLE$/, "")
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return formatted;
  }

  /**
   * Formats an input parameter object or value into standard competitive programming notation.
   * e.g. { a: 12, b: 8 } -> "a = 12, b = 8"
   * e.g. { nums: [1, 2, 3], target: 4 } -> "nums = [1, 2, 3], target = 4"
   */
  formatNormalInput(input: any): string {
    if (input === null || input === undefined) return "";
    let data = input;
    if (typeof data === "string") {
      const trimmed = data.trim();
      if (
        (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))
      ) {
        try {
          data = JSON.parse(trimmed);
        } catch {
          return trimmed;
        }
      } else {
        return trimmed;
      }
    }

    if (typeof data === "object" && data !== null) {
      if (typeof data.stdin === "string") {
        return data.stdin.trim();
      }
      if (Array.isArray(data)) {
        return `[${data.map((item) => this.formatSingleOutputValue(item)).join(", ")}]`;
      }
      const parts: string[] = [];
      for (const [k, v] of Object.entries(data)) {
        if (v === null || v === undefined) continue;
        if (typeof v === "string") {
          parts.push(`${k} = "${v}"`);
        } else if (typeof v === "number" || typeof v === "boolean") {
          parts.push(`${k} = ${v}`);
        } else if (Array.isArray(v)) {
          parts.push(`${k} = [${v.map((item) => this.formatSingleOutputValue(item)).join(", ")}]`);
        } else {
          parts.push(`${k} = ${JSON.stringify(v)}`);
        }
      }
      if (parts.length > 0) {
        return parts.join(", ");
      }
    }

    return String(data);
  }

  /**
   * Formats an expected or returned output into clean competitive programming format without wrapper objects.
   * e.g. { result: 20 } -> "20"
   * e.g. { ans: [0, 1] } -> "[0, 1]"
   * e.g. 20 -> "20"
   */
  formatNormalOutput(output: any): string {
    if (output === null || output === undefined) return "";
    let data = output;
    if (typeof data === "string") {
      const trimmed = data.trim();
      if (
        (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))
      ) {
        try {
          data = JSON.parse(trimmed);
        } catch {
          return trimmed;
        }
      } else {
        return trimmed;
      }
    }

    if (typeof data === "object" && data !== null) {
      if ("result" in data) return this.formatSingleOutputValue(data.result);
      if ("ans" in data) return this.formatSingleOutputValue(data.ans);
      if ("answer" in data) return this.formatSingleOutputValue(data.answer);
      if ("output" in data) return this.formatSingleOutputValue(data.output);
      if ("indices" in data) return this.formatSingleOutputValue(data.indices);
      if ("index" in data) return this.formatSingleOutputValue(data.index);
      if ("expectedOutput" in data) return this.formatSingleOutputValue(data.expectedOutput);

      const keys = Object.keys(data);
      if (keys.length === 1) {
        return this.formatSingleOutputValue(data[keys[0]]);
      }
      if (Array.isArray(data)) {
        return `[${data.map((item) => this.formatSingleOutputValue(item)).join(", ")}]`;
      }
      return JSON.stringify(data);
    }

    return this.formatSingleOutputValue(data);
  }

  private formatSingleOutputValue(val: any): string {
    if (val === null || val === undefined) return "";
    if (typeof val === "boolean" || typeof val === "number") return String(val);
    if (typeof val === "string") return val;
    if (Array.isArray(val)) {
      return `[${val.map((item) => this.formatSingleOutputValue(item)).join(", ")}]`;
    }
    return JSON.stringify(val);
  }

  /**
   * Sanitizes an entire problem statement narrative so any raw JSON inputs or outputs
   * are converted into clean competitive programming style.
   */
  sanitizeNarrative(narrative: string): string {
    if (!narrative || typeof narrative !== "string") return narrative;

    // First, handle markdown code blocks under Sample Input / Expected Output
    let cleaned = narrative.replace(
      /(###+\s*(?:Sample\s+)?Input\s*\n+)```(?:json)?\s*([\s\S]*?)\s*```/gi,
      (match, heading, code) => {
        const formatted = this.formatNormalInput(code.trim());
        return `${heading}\`\`\`\n${formatted}\n\`\`\``;
      },
    );

    cleaned = cleaned.replace(
      /(###+\s*(?:Sample\s+|Expected\s+)?Output\s*\n+)```(?:json)?\s*([\s\S]*?)\s*```/gi,
      (match, heading, code) => {
        const formatted = this.formatNormalOutput(code.trim());
        return `${heading}\`\`\`\n${formatted}\n\`\`\``;
      },
    );

    const lines = cleaned.split("\n");
    const outLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Normalize bulleted input / output / explanation lines
      line = line.replace(/^\s*[-*]\s+\*\*Input\*\*:\s*/i, "**Input:** ");
      line = line.replace(/^\s*[-*]\s+\*\*Input:\*\*\s*/i, "**Input:** ");
      line = line.replace(/^\s*\*\*Input\*\*:\s*/i, "**Input:** ");

      line = line.replace(/^\s*[-*]\s+\*\*Output\*\*:\s*/i, "**Output:** ");
      line = line.replace(/^\s*[-*]\s+\*\*Output:\*\*\s*/i, "**Output:** ");
      line = line.replace(/^\s*\*\*Output\*\*:\s*/i, "**Output:** ");

      line = line.replace(/^\s*[-*]\s+\*\*Explanation\*\*:\s*/i, "**Explanation:** ");
      line = line.replace(/^\s*[-*]\s+\*\*Explanation:\*\*\s*/i, "**Explanation:** ");
      line = line.replace(/^\s*\*\*Explanation\*\*:\s*/i, "**Explanation:** ");

      const inputMatch = line.match(/^(\s*\*\*Input:\*\*\s*)(.*)$/i);
      if (inputMatch) {
        const prefix = inputMatch[1];
        let val = inputMatch[2].trim();
        if (val.startsWith("`") && val.endsWith("`")) {
          val = val.slice(1, -1).trim();
        }
        const formatted = this.formatNormalInput(val);
        outLines.push(`${prefix}\`${formatted}\``);
        continue;
      }

      const outputMatch = line.match(/^(\s*\*\*Output:\*\*\s*)(.*)$/i);
      if (outputMatch) {
        const prefix = outputMatch[1];
        let val = outputMatch[2].trim();
        if (val.startsWith("`") && val.endsWith("`")) {
          val = val.slice(1, -1).trim();
        }
        const formatted = this.formatNormalOutput(val);
        outLines.push(`${prefix}\`${formatted}\``);
        continue;
      }

      outLines.push(line);
    }

    return outLines.join("\n");
  }
}
