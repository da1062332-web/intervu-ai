import { PRNG } from "./utils/random-seed.util";
import {
  hydrateString,
  generateDistractors,
  evaluateExpression,
  roundToPrecision,
} from "@intervu-ai/generation";
import { HydratedSolution } from "./types/generation.types";

export class QuestionInstantiatorService {
  /**
   * Instantiates the question text, computes the correct answer,
   * generates distractors, and shuffles them deterministically using PRNG.
   */
  instantiateQuestion(
    structureSchema: Record<string, unknown>,
    solutionSchema: Record<string, unknown>,
    parameters: Record<string, unknown>,
    prng: PRNG,
  ): {
    questionText: string;
    options: string[];
    correctAnswer: string;
    solution: HydratedSolution;
  } {
    const questionTemplateText = (structureSchema.questionTemplate ||
      "") as string;
    const solutionStepsTemplate = (solutionSchema.steps || []) as string[];
    const finalAnswerExpression = (solutionSchema.finalAnswer || "") as string;

    // 1. Hydrate question text
    const questionText = hydrateString(questionTemplateText, parameters);
    if (questionText.includes("{") && questionText.includes("}")) {
      throw new Error(
        "Question text contains unresolved placeholder variables.",
      );
    }

    // 2. Solve final answer expression mathematically
    let correctAnswerVal: number;
    try {
      const result = evaluateExpression(finalAnswerExpression, parameters);
      if (typeof result !== "number" || isNaN(result) || !isFinite(result)) {
        throw new Error(
          "Solvability failure: expression did not resolve to a finite number.",
        );
      }
      correctAnswerVal = result;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to evaluate final answer expression: ${msg}`);
    }

    // Format correct answer as a string (round to 2 decimal places if float, or no decimal places if integer)
    const isAnswerInt = Number.isInteger(correctAnswerVal);
    const formattedAnswer = String(
      roundToPrecision(correctAnswerVal, isAnswerInt ? 1 : 0.01),
    );

    // 3. Hydrate solution steps
    const hydratedSteps = solutionStepsTemplate.map((step) =>
      hydrateString(step, parameters),
    );

    // 4. Generate distractors
    const distractors = generateDistractors(correctAnswerVal);

    // 5. Combine and shuffle options deterministically
    const allOptions = [formattedAnswer, ...distractors];
    const shuffledOptions = prng.shuffle(allOptions);

    return {
      questionText,
      options: shuffledOptions,
      correctAnswer: formattedAnswer,
      solution: {
        steps: hydratedSteps,
        finalAnswer: formattedAnswer,
      },
    };
  }
}
