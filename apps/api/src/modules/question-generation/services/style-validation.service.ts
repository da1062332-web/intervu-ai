import { Injectable } from "@nestjs/common";
import { RawQuestion } from "../interfaces/validation-strategy.interface";

@Injectable()
export class StyleValidationService {
  async validate(
    styleProfile: any,
    question: RawQuestion,
    difficulty: string,
  ): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!styleProfile) {
      return { valid: true, errors, warnings };
    }

    // 1. Distractor Rules: exactlyFourOptions
    if (styleProfile.distractorRules?.exactlyFourOptions) {
      if (!question.options || question.options.length !== 4) {
        errors.push(
          `Style constraint violation: expected exactly 4 options, got ${question.options?.length ?? 0}.`,
        );
      }
    }

    // 2. Distractor Rules: oneCorrectAnswer
    if (styleProfile.distractorRules?.oneCorrectAnswer) {
      const validAnswers = ["A", "B", "C", "D"];
      if (!validAnswers.includes(question.correctAnswer?.toUpperCase())) {
        errors.push(
          `Style constraint violation: correct answer "${question.correctAnswer}" must be A, B, C, or D.`,
        );
      }
    }

    // 3. Explanation Style: stepWiseSolution & maxSteps
    if (styleProfile.explanationStyle?.stepWiseSolution) {
      const stepsCount = (
        question.explanation?.match(/Step\s*\d+|step\s*\d+/gi) || []
      ).length;
      if (
        stepsCount === 0 &&
        !question.explanation?.toLowerCase().includes("step")
      ) {
        warnings.push(
          "Style constraint warning: explanation should follow a step-wise format.",
        );
      }
      if (
        styleProfile.explanationStyle?.maxSteps &&
        stepsCount > styleProfile.explanationStyle.maxSteps
      ) {
        errors.push(
          `Style constraint violation: explanation steps (${stepsCount}) exceed max steps allowed (${styleProfile.explanationStyle.maxSteps}).`,
        );
      }
    }

    // 4. Language Style: sentenceLength guidelines
    const sentenceLength = styleProfile.languageStyle?.sentenceLength;
    if (sentenceLength === "short" && question.questionText) {
      const wordCount = question.questionText.split(/\s+/).length;
      if (wordCount > 35) {
        warnings.push(
          `Style constraint warning: sentence length is verbose (${wordCount} words) for short wording style.`,
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
