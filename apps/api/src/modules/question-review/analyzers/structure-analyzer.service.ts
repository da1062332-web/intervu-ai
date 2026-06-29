import { Injectable } from "@nestjs/common";

interface QuestionInput {
  questionText?: string;
  answer?: string;
  explanation?: string;
  options?: unknown;
}

@Injectable()
export class StructureAnalyzerService {
  async analyze(
    question: QuestionInput,
  ): Promise<{ score: number; isValid: boolean; issues: string[] }> {
    let score = 100;
    const issues: string[] = [];

    // 1. Question text checks
    if (!question.questionText || question.questionText.trim().length === 0) {
      score -= 20;
      issues.push("Question text is empty or missing");
    }

    // 2. Answer checks
    if (!question.answer || question.answer.trim().length === 0) {
      score -= 20;
      issues.push("Correct answer is empty or missing");
    }

    // 3. Explanation checks
    if (!question.explanation || question.explanation.trim().length === 0) {
      score -= 20;
      issues.push("Explanation is empty or missing");
    }

    // 4. Options checks
    let optionsArray: string[] = [];
    if (!question.options) {
      score -= 20;
      issues.push("Options are missing");
    } else {
      if (Array.isArray(question.options)) {
        optionsArray = question.options;
      } else if (typeof question.options === "string") {
        try {
          const parsed = JSON.parse(question.options);
          if (Array.isArray(parsed)) {
            optionsArray = parsed;
          } else {
            score -= 20;
            issues.push("Options string is not a valid JSON array");
          }
        } catch {
          score -= 20;
          issues.push("Options string is not a valid JSON");
        }
      } else {
        score -= 20;
        issues.push("Options format is invalid (expected array or string)");
      }
    }

    // Validate options content
    if (optionsArray.length > 0) {
      if (optionsArray.length < 2) {
        score -= 10;
        issues.push("Multiple choice questions must have at least 2 options");
      }

      const uniqueOpts = new Set(optionsArray.map((o) => String(o).trim()));
      if (uniqueOpts.size !== optionsArray.length) {
        score -= 10;
        issues.push("Options contain duplicate choices");
      }

      if (question.answer) {
        const trimmedAnswer = question.answer.trim().toLowerCase();
        const hasAnswer = optionsArray.some(
          (o) => String(o).trim().toLowerCase() === trimmedAnswer,
        );
        if (!hasAnswer) {
          score -= 20;
          issues.push(
            "The correct answer does not match any of the provided options",
          );
        }
      }
    }

    // Clamp score to 0-100
    score = Math.max(0, Math.min(100, score));

    return {
      score,
      isValid: issues.length === 0,
      issues,
    };
  }
}
