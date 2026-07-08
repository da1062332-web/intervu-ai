import { Injectable } from "@nestjs/common";
import { GeneratedQuestionDto } from "../dto/generated-question.dto";
import { DifficultyValidatorService } from "../validators/difficulty-validator.service";
import { TopicAlignmentService } from "../validators/topic-alignment.service";

export interface QualityScore {
  score: number;
  status: "PASS" | "FAIL";
  reasons: string[];
}

@Injectable()
export class QuestionQualityService {
  constructor(
    private readonly topicValidator: TopicAlignmentService,
    private readonly difficultyValidator: DifficultyValidatorService,
  ) {}

  async score(
    generated: GeneratedQuestionDto,
    requestedTopic: string,
    requestedDifficulty: string,
  ): Promise<QualityScore> {
    const reasons: string[] = [];

    // 1. Grammar & Clarity (10%)
    let clarityScore = 100;
    if (!generated.question || generated.question.trim().length === 0) {
      clarityScore = 0;
      reasons.push("Question structure is too short or empty.");
    } else if (generated.question.trim().length < 15) {
      clarityScore = 50;
      reasons.push("Question structure is too short or empty.");
    }

    if (
      generated.question &&
      (generated.question.includes("???") ||
        generated.question.includes("undefined") ||
        /\{([a-zA-Z0-9_]+)\}/.test(generated.question))
    ) {
      clarityScore = 0;
      reasons.push("Question contains placeholder tokens, undefined, or ???.");
    }

    // 2. Answer & Option Validity (20%)
    let validityScore = 100;
    const cleanAnswer = String(generated.correctAnswer || generated.answer || "").trim();
    if (!cleanAnswer || cleanAnswer.length === 0) {
      validityScore = 0;
      reasons.push("Correct answer is empty or missing.");
    } else if (
      cleanAnswer.toLowerCase().includes("placeholder") ||
      cleanAnswer.toLowerCase().includes("todo")
    ) {
      validityScore = 0;
      reasons.push("Answer contains placeholder/TODO text.");
    }

    const options = generated.options || [];
    const isMcq = options.length > 0;
    if (isMcq) {
      if (options.length !== 4) {
        validityScore = 0;
        reasons.push(`MCQ options must have exactly 4 items, got ${options.length}.`);
      } else {
        const unique = new Set(options.map((opt) => String(opt).trim()));
        if (unique.size !== options.length) {
          validityScore = 0;
          reasons.push("MCQ options contain duplicate items.");
        }
        if (!options.map((o) => String(o).trim()).includes(cleanAnswer)) {
          validityScore = 0;
          reasons.push("Correct answer is not present in options.");
        }
      }
    }

    // 3. Explanation Quality (20%)
    let explanationScore = 100;
    const explanation = generated.explanation || "";
    if (explanation.trim().length === 0) {
      explanationScore = 0;
      reasons.push("Explanation is empty or missing.");
    } else if (explanation.trim().length < 20) {
      explanationScore = 50;
      reasons.push("Explanation is too short (under 20 characters).");
    }

    const cleanExp = explanation.toLowerCase();
    const hasConcept = cleanExp.includes("concept");
    const hasFormula = cleanExp.includes("formula") || cleanExp.includes("reasoning");
    const hasSteps = cleanExp.includes("step-by-step") || cleanExp.includes("solution");
    const hasFinalAnswer = cleanExp.includes("final answer") || cleanExp.includes("answer");

    let missingCount = 0;
    if (!hasConcept) missingCount++;
    if (!hasFormula) missingCount++;
    if (!hasSteps) missingCount++;
    if (!hasFinalAnswer) missingCount++;

    if (missingCount > 0) {
      explanationScore = Math.max(0, explanationScore - missingCount * 25);
      reasons.push(`Explanation is missing ${missingCount} required headers.`);
    }

    if (cleanAnswer && !cleanExp.includes(cleanAnswer.toLowerCase())) {
      explanationScore = Math.max(0, explanationScore - 30);
      reasons.push("Explanation does not reference the correct answer.");
    }

    // 4. Template Compliance / Topic Match (20%)
    const topicResult = await this.topicValidator.validate(
      generated,
      requestedTopic,
    );
    const complianceScore = topicResult.match ? 100 : topicResult.confidence * 100;
    if (!topicResult.match) {
      reasons.push(
        `Topic mismatch: requested "${requestedTopic}", generated "${generated.topic || requestedTopic}"`,
      );
    }

    // 5. Difficulty Consistency (20%)
    const diffResult = await this.difficultyValidator.validate(
      generated,
      requestedDifficulty,
    );
    const difficultyScore = diffResult ? 100 : 0;
    if (!diffResult) {
      reasons.push(
        `Difficulty mismatch: requested "${requestedDifficulty}", generated "${generated.difficulty}"`,
      );
    }

    // 6. Option Length Parity (10%)
    let parityScore = 100;
    if (isMcq) {
      const cleanOptions = options.map((opt) => String(opt).trim());
      const lengths = cleanOptions.map((opt) => opt.length);
      const minLen = Math.min(...lengths);
      const maxLen = Math.max(...lengths);
      const hasCodeSyntax = cleanOptions.some((opt) =>
        opt.includes("`") ||
        /({|}|\bconst\b|\bdef\b|=>|\bimport\b|\bfunction\b|\bpublic\s+class\b|<html>|<\/html>|\bconsole\.log\b|;|\[|\])/.test(opt)
      );
      const allShort = cleanOptions.every((opt) => opt.length < 15);

      if (!hasCodeSyntax && !allShort) {
        if (minLen === 0 || maxLen / minLen > 2.5) {
          parityScore = 0;
          reasons.push("Option lengths are imbalanced (longest option is > 2.5x shortest option).");
        }
      }
    }

    // Calculate weighted average
    const totalScore =
      clarityScore * 0.1 +
      validityScore * 0.2 +
      explanationScore * 0.2 +
      complianceScore * 0.2 +
      difficultyScore * 0.2 +
      parityScore * 0.1;

    const status = totalScore >= 80 ? "PASS" : "FAIL";

    return {
      score: Math.round(totalScore),
      status,
      reasons,
    };
  }
}
