import { Injectable, BadRequestException } from "@nestjs/common";

export function isAnswerReferencedInExplanation(
  explanation: string,
  correctAnswer: string,
): boolean {
  if (!explanation) return false;
  const cleanExp = explanation.toLowerCase();
  const cleanAnswer = String(correctAnswer ?? "").trim().toLowerCase();
  if (!cleanAnswer) return true;

  // 1. Direct exact match (works for numbers, short answers, keywords)
  if (cleanExp.includes(cleanAnswer)) {
    return true;
  }

  // 2. Multi-part or long answer (> 25 chars or contains / or ;)
  if (
    cleanAnswer.length > 25 ||
    cleanAnswer.includes("/") ||
    cleanAnswer.includes(";")
  ) {
    // Check if arrangement letters (e.g. "CABD" or "C -> A -> B -> D") are mentioned
    const letterCode =
      cleanAnswer.match(/\b[A-Da-d]\b/g)?.join("").toLowerCase() || "";
    if (letterCode.length >= 3 && cleanExp.includes(letterCode)) {
      return true;
    }

    // Check if major segments/phrases from the answer are mentioned
    const segments = cleanAnswer
      .split(/\s*[\/,;]\s*/)
      .map((s) => s.replace(/^[A-Da-d][).:-]\s*/, "").trim())
      .filter((s) => s.length > 8);

    if (segments.length > 0 && segments.some((seg) => cleanExp.includes(seg))) {
      return true;
    }

    // Keyword overlap check (token intersection)
    const ansWords = cleanAnswer.split(/\W+/).filter((w) => w.length > 4);
    if (ansWords.length >= 3) {
      const matchCount = ansWords.filter((w) => cleanExp.includes(w)).length;
      if (matchCount / ansWords.length >= 0.5) {
        return true;
      }
    }
  }

  return false;
}

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

    // Check presence of required sections with flexible fallback keywords.
    // Verbal/jumbled questions may use "reasoning", "conclusion", "correct sequence" etc.
    // instead of the exact math-centric headings.
    const hasConcept =
      cleanExp.includes("concept") ||
      cleanExp.includes("understanding") ||
      cleanExp.includes("topic");

    const hasFormula =
      cleanExp.includes("formula") ||
      cleanExp.includes("reasoning") ||
      cleanExp.includes("logic") ||
      cleanExp.includes("explanation") ||
      cleanExp.includes("rule");

    const hasSteps =
      cleanExp.includes("step-by-step") ||
      cleanExp.includes("solution") ||
      cleanExp.includes("step ") ||
      cleanExp.includes("sequence") ||
      cleanExp.includes("order") ||
      cleanExp.includes("arrangement");

    const hasFinalAnswer =
      cleanExp.includes("final answer") ||
      cleanExp.includes("answer") ||
      cleanExp.includes("conclusion") ||
      cleanExp.includes("correct option") ||
      cleanExp.includes("correct sequence") ||
      cleanExp.includes("therefore");

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
    if (!isAnswerReferencedInExplanation(explanation, correctAnswer)) {
      throw new BadRequestException(
        `Explanation alignment check failed: The correct answer "${correctAnswer}" is not referenced in the explanation body.`,
      );
    }
  }
}

