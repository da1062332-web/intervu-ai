
git add apps/worker/package.json package-lock.jsonimport { Injectable, BadRequestException } from "@nestjs/common";

@Injectable()
export class ExplanationGeneratorService {
  /**
   * Validates that the explanation strictly follows the structured layout:
   * Concept -> Formula / Reasoning -> Step-by-Step Solution -> Final Answer
   */
  validateExplanation(explanation: string, correctAnswer: string): void {
    if (!explanation || explanation.trim().length === 0) {
      throw new BadRequestException("Explanation text is empty or missing");
    }

    const cleanExp = explanation.toLowerCase();

    // Check presence of required sections
    const hasConcept = cleanExp.includes("concept");
    const hasFormula = cleanExp.includes("formula") || cleanExp.includes("reasoning");
    const hasSteps = cleanExp.includes("step-by-step") || cleanExp.includes("solution");
    const hasFinalAnswer = cleanExp.includes("final answer") || cleanExp.includes("answer");

    const missingSections: string[] = [];
    if (!hasConcept) missingSections.push("Concept");
    if (!hasFormula) missingSections.push("Formula / Reasoning");
    if (!hasSteps) missingSections.push("Step-by-Step Solution");
    if (!hasFinalAnswer) missingSections.push("Final Answer");

    if (missingSections.length > 0) {
      throw new BadRequestException(
        `Explanation is missing required section headings: ${missingSections.join(", ")}. It must follow: Concept -> Formula / Reasoning -> Step-by-Step Solution -> Final Answer`,
      );
    }

    // Verify explanation contains references to the correct answer value to ensure alignment
    const cleanAnswer = String(correctAnswer).trim().toLowerCase();
    if (cleanAnswer && !cleanExp.includes(cleanAnswer)) {
      throw new BadRequestException(
        `Explanation alignment check failed: The correct answer "${correctAnswer}" is not referenced in the explanation body.`,
      );
    }
  }
}
