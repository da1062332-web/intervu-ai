import { Injectable } from "@nestjs/common";
import { GeneratedQuestionDto } from "../dto/generated-question.dto";

@Injectable()
export class DifficultyValidatorService {
  async validate(
    generated: GeneratedQuestionDto,
    requestedDifficulty: string,
  ): Promise<boolean> {
    const genDifficulty = (generated.difficulty || "").trim().toLowerCase();
    const reqDifficulty = (requestedDifficulty || "").trim().toLowerCase();

    if (genDifficulty && genDifficulty !== reqDifficulty) {
      return false;
    }

    // For HARD difficulty, enforce cognitive complexity & reasoning depth checks
    if (reqDifficulty === "hard") {
      const qText = (generated.question || "").trim();
      const expText = (generated.explanation || "").trim();

      // HARD questions must be at least 100 characters long to contain multi-step premises
      if (qText.length < 100) {
        return false;
      }

      // Check for multi-step reasoning indicators in step-by-step solution
      const stepMatches = expText.match(/\d+\.\s/g) || [];
      if (stepMatches.length < 3 && expText.length < 150) {
        return false;
      }

      // Check entity/variable count for reasoning questions
      const entityMatches = Array.from(
        new Set(qText.match(/\b[A-Z0-9_]{1,4}\b/g) || []),
      );
      if (entityMatches.length < 4 && qText.length < 140) {
        return false;
      }
    }

    return true;
  }
}
