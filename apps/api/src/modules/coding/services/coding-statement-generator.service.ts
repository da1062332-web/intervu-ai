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
   * Generates or polishes the problem statement narrative using the AI service layer.
   * STRICT GUARANTEE: AI only provides narrative text; inputs, outputs, and test cases
   * are 100% determined by the Oracle and cannot be modified by AI.
   */
  async generateStatement(
    pattern: CodingPattern,
    executionResult: PatternExecutionResultData,
  ): Promise<AIStatementResult> {
    const oracleKey = (pattern.oracleKey || "").toUpperCase();
    const defaultTitle = pattern.title || "Coding Challenge";

    let defaultNarrative = "";
    let defaultConstraints =
      "Follow standard time O(N) and space O(1) efficiency guidelines.";

    let oracleDescription = pattern.description || "process the input parameters and return the result matching the problem specification";
    
    if (this.oracleRegistry && oracleKey) {
      try {
        const oracle = this.oracleRegistry.getOracle(oracleKey);
        if (oracle.description) {
          oracleDescription = oracle.description;
        }
      } catch (e) {
        // Fallback if oracle is not found in registry
      }
    }

    defaultNarrative = `Write a function to ${oracleDescription}.

### Sample Input
${JSON.stringify(executionResult.generatedInput, null, 2)}

### Expected Output
${JSON.stringify(executionResult.expectedOutput, null, 2)}`;

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
Difficulty Level: ${pattern.difficulty}
Pattern Oracle Key: ${pattern.oracleKey}
Oracle Description: ${oracleDescription}
Pattern Description: ${pattern.description || "N/A"}
Parameter Schema: ${JSON.stringify(pattern.parameterSchema)}
Sample Input: ${JSON.stringify(executionResult.generatedInput)}
Expected Output: ${JSON.stringify(executionResult.expectedOutput)}

Generate JSON with fields:
{
  "title": "A compelling title",
  "narrative": "A clear problem description explaining what function to implement, what the inputs are, and what output is expected. Use markdown.",
  "constraintsDescription": "Input bounds and constraints based on the parameter schema and difficulty."
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
      // Fallback to pattern default values on AI failure/timeout/invalid format
      return {
        title: defaultTitle,
        narrative: defaultNarrative,
        constraintsDescription: defaultConstraints,
      };
    }
  }
}
