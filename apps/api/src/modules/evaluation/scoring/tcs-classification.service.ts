import { Injectable, Inject, Logger } from "@nestjs/common";
import { SectionScoreDto } from "@intervu-ai/contracts";
import { QuestionEvaluationResult } from "../objective/objective-evaluator.service";
import { LLMAdapter } from "../../generation-ai/adapters/llm-adapter.interface";

export interface ClassificationResult {
  predictedProfile: string;
  profileDetails: {
    numericalAccuracy: number;
    verbalAccuracy: number;
    reasoningAccuracy: number;
    codingLevel: string;
    codingFeedback: string;
  };
}

@Injectable()
export class TcsClassificationService {
  private readonly logger = new Logger("TcsClassificationService");

  constructor(
    @Inject("LLM_ADAPTER") private readonly llmAdapter: LLMAdapter,
  ) {}

  /**
   * Evaluates the candidate's performance across Numerical, Verbal, Reasoning, and Coding sections.
   * Returns null if the required sections are not present.
   */
  async classifyProfile(
    sectionScores: SectionScoreDto[],
    codingEvaluations: QuestionEvaluationResult[],
  ): Promise<ClassificationResult | null> {
    const requiredSections = ["numerical", "verbal", "reasoning", "coding"];
    
    const sectionMap = new Map<string, SectionScoreDto>();
    for (const score of sectionScores) {
      // Create a normalized key mapping for easy lookup
      const normalizedName = score.sectionName.toLowerCase();
      if (normalizedName.includes("numerical")) sectionMap.set("numerical", score);
      if (normalizedName.includes("verbal")) sectionMap.set("verbal", score);
      if (normalizedName.includes("reasoning")) sectionMap.set("reasoning", score);
      if (normalizedName.includes("coding")) sectionMap.set("coding", score);
    }

    // Ensure all 4 sections are present
    const hasAllSections = requiredSections.every(sec => sectionMap.has(sec));
    if (!hasAllSections) {
      return null;
    }

    const numericalAcc = sectionMap.get("numerical")?.accuracy || 0;
    const verbalAcc = sectionMap.get("verbal")?.accuracy || 0;
    const reasoningAcc = sectionMap.get("reasoning")?.accuracy || 0;

    // Evaluate Coding Section Holistically via LLM
    const { codingLevel, codingFeedback } = await this.evaluateOverallCodingPerformance(codingEvaluations);

    // Classification Matrix
    // Prime: >= 90% and Excellent
    // Digital: >= 80% and Strong
    // Ninja: >= 70% and Basic / Moderate
    
    let predictedProfile = "Not Qualified";

    if (
      numericalAcc >= 90 && verbalAcc >= 90 && reasoningAcc >= 90 && 
      codingLevel === "Excellent"
    ) {
      predictedProfile = "Prime";
    } else if (
      numericalAcc >= 80 && verbalAcc >= 80 && reasoningAcc >= 80 && 
      (codingLevel === "Strong" || codingLevel === "Excellent")
    ) {
      predictedProfile = "Digital";
    } else if (
      numericalAcc >= 70 && verbalAcc >= 70 && reasoningAcc >= 70 && 
      (codingLevel === "Basic / Moderate" || codingLevel === "Strong" || codingLevel === "Excellent")
    ) {
      predictedProfile = "Ninja";
    }

    this.logger.log(`Classification complete. Predicted Profile: ${predictedProfile}`);

    return {
      predictedProfile,
      profileDetails: {
        numericalAccuracy: numericalAcc,
        verbalAccuracy: verbalAcc,
        reasoningAccuracy: reasoningAcc,
        codingLevel,
        codingFeedback
      }
    };
  }

  private sanitizeForPrompt(input: string): string {
    if (!input || typeof input !== 'string') return '(no submission)';
    // AI Risk: Truncate to prevent very large inputs from exceeding context or hiding injections
    const maxLength = 3000;
    let sanitized = input.slice(0, maxLength);
    if (input.length > maxLength) {
      sanitized += '\n...(truncated)';
    }
    // AI Risk: Strip common prompt injection patterns
    // These patterns attempt to override the system role or inject new instructions
    sanitized = sanitized
      .replace(/ignore (all |previous |above |prior )?instructions?/gi, '[REDACTED]')
      .replace(/you are (now |a |an )?/gi, '[REDACTED]')
      .replace(/system:|assistant:|user:|human:|prompt:/gi, '[REDACTED]');
    return sanitized;
  }

  private async evaluateOverallCodingPerformance(
    codingEvaluations: QuestionEvaluationResult[]
  ): Promise<{ codingLevel: string, codingFeedback: string }> {
    if (!codingEvaluations || codingEvaluations.length === 0) {
      return { codingLevel: "Basic / Moderate", codingFeedback: "No coding questions attempted." };
    }

    const submissionsStr = codingEvaluations.map((evalObj, idx) => `
--- Coding Question ${idx + 1} ---
Expected Solution / Logic:
${this.sanitizeForPrompt(evalObj.correctAnswer)}

Candidate's Submission & Execution Output (JSON or Raw):
${this.sanitizeForPrompt(evalObj.candidateAnswer)}

Individual Assigned Score (0.0 to 1.0): ${typeof evalObj.score === 'number' ? evalObj.score.toFixed(2) : '0.00'}
`).join("\n");


    const prompt = `
You are an expert technical recruiter assessing a candidate's overall coding capability across a set of coding questions.
You must classify their holistic performance into exactly one of these three levels:
1. "Basic / Moderate" -> Minimal logic implemented, fails many test cases, or poor code structure.
2. "Strong" -> Good logic, passes most test cases, solid understanding of the problem.
3. "Excellent" -> Optimal logic, passes all test cases, production-ready code structure.

### Candidate's Coding Submissions:
${submissionsStr}

Evaluate the candidate's overall coding performance based on the complexity of the solutions, execution outputs, and their individual scores.

Respond ONLY with a valid JSON object in the following format:
{
  "codingLevel": "Basic / Moderate" | "Strong" | "Excellent",
  "feedback": "string explaining the classification"
}
Ensure the output is ONLY valid JSON. Do not include markdown tags like \`\`\`json.
`;

    let lastError: unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await this.llmAdapter.generate(prompt);
        let cleaned = response.trim();
        if (cleaned.startsWith("\`\`\`")) {
          cleaned = cleaned
            .replace(/^\`\`\`(?:json)?/gi, "")
            .replace(/\`\`\`$/gi, "")
            .trim();
        }
        
        const parsedResponse = JSON.parse(cleaned);
        
        if (
          parsedResponse &&
          ["Basic / Moderate", "Strong", "Excellent"].includes(parsedResponse.codingLevel)
        ) {
          return {
            codingLevel: parsedResponse.codingLevel,
            codingFeedback: parsedResponse.feedback || "",
          };
        }
        
        throw new Error("Invalid format returned by LLM");
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `LLM overall coding classification failed on attempt ${attempt}. Retrying...`,
          {
            error: error instanceof Error ? error.message : String(error),
          },
        );
      }
    }

    this.logger.warn(
      "LLM overall coding classification completely failed. Falling back to Basic / Moderate.",
      {
        error: lastError instanceof Error ? lastError.message : String(lastError),
      }
    );

    return { codingLevel: "Basic / Moderate", codingFeedback: "Fallback due to LLM error." };
  }
}
