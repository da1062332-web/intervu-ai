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
        narrative: existingNarrative,
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
        narrative: specificNarrative.narrative,
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
        narrative: defaultNarrative,
        constraintsDescription: defaultConstraints,
      };
    }

    try {
      const prompt = `You are an expert technical interviewer writing a coding problem statement.
Problem Title: ${defaultTitle}
Difficulty Level: ${difficulty}
Pattern Oracle Key: ${oracleKey}
Parameter Schema: ${JSON.stringify(pattern.parameterSchema)}
Sample Input: ${JSON.stringify(executionResult.generatedInput)}
Expected Output: ${JSON.stringify(executionResult.expectedOutput)}

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
            ? parsed.narrative.trim()
            : defaultNarrative,
        constraintsDescription:
          typeof parsed.constraintsDescription === "string" &&
          parsed.constraintsDescription.trim()
            ? parsed.constraintsDescription.trim()
            : defaultConstraints,
      };
    } catch {
      return {
        title: defaultTitle,
        narrative: defaultNarrative,
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

    const inpStr = JSON.stringify(executionResult.generatedInput);
    const outStr = JSON.stringify(executionResult.expectedOutput);

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
- **Input**: \`${inpStr}\`
- **Output**: \`${outStr}\`
- **Explanation**: Generates the expected result matching the problem specification.

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
}
