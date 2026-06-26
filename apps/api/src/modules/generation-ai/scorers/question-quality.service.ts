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

    // 1. Structure (20%)
    let structureScore = 100;
    if (!generated.question || generated.question.trim().length < 10) {
      structureScore = 0;
      reasons.push("Question structure is too short or empty.");
    }
    if (!generated.explanation || generated.explanation.trim().length < 10) {
      structureScore = Math.min(structureScore, 50);
      reasons.push("Explanation structure is too short or empty.");
    }

    // 2. Topic Alignment (25%)
    const topicResult = await this.topicValidator.validate(
      generated,
      requestedTopic,
    );
    const topicScore = topicResult.match ? 100 : topicResult.confidence * 100;
    if (!topicResult.match) {
      reasons.push(
        `Topic mismatch: requested "${requestedTopic}", generated "${generated.topic}"`,
      );
    }

    // 3. Difficulty Match (25%)
    const diffResult = await this.difficultyValidator.validate(
      generated,
      requestedDifficulty,
    );
    const diffScore = diffResult ? 100 : 0;
    if (!diffResult) {
      reasons.push(
        `Difficulty mismatch: requested "${requestedDifficulty}", generated "${generated.difficulty}"`,
      );
    }

    // 4. Answer Validity (20%)
    let answerScore = 100;
    if (!generated.answer || generated.answer.trim().length === 0) {
      answerScore = 0;
      reasons.push("Answer is empty or invalid.");
    } else if (
      generated.answer.toLowerCase().includes("placeholder") ||
      generated.answer.toLowerCase().includes("todo")
    ) {
      answerScore = 0;
      reasons.push("Answer contains placeholder/TODO text.");
    }

    // 5. Clarity (10%)
    let clarityScore = 100;
    if (
      generated.question &&
      (generated.question.includes("???") ||
        generated.question.includes("undefined"))
    ) {
      clarityScore = 0;
      reasons.push(
        "Question contains unclear wording or undefined placeholders.",
      );
    }

    // Calculate weighted average
    const totalScore =
      structureScore * 0.2 +
      topicScore * 0.25 +
      diffScore * 0.25 +
      answerScore * 0.2 +
      clarityScore * 0.1;

    const status = totalScore >= 80 ? "PASS" : "FAIL";

    return {
      score: Math.round(totalScore),
      status,
      reasons,
    };
  }
}
