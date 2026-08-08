import { Injectable } from "@nestjs/common";
import { OverallScoreDto, SectionScoreDto } from "@intervu-ai/contracts";
import { QuestionEvaluationResult } from "../objective/objective-evaluator.service";

const PASS_PERCENTAGE_THRESHOLD = 40;

@Injectable()
export class OverallScoreService {
  /**
   * Calculates overall scoring metrics, including a split of objective vs coding scores.
   */
  calculateOverallScore(
    sectionScores: SectionScoreDto[],
    objectiveEvalResults: QuestionEvaluationResult[],
    codingEvalResults: QuestionEvaluationResult[],
  ): OverallScoreDto {
    let totalCorrect = 0;
    let totalAttempted = 0;
    let totalQuestions = 0;
    let totalMarks = 0;
    let maxMarks = 0;

    for (const section of sectionScores) {
      totalMarks += section.marks;
      totalCorrect += section.correct;
      totalQuestions +=
        section.totalQuestions ??
        section.correct + section.incorrect + section.skipped;
      totalAttempted +=
        section.attempted ?? section.correct + section.incorrect;
      maxMarks +=
        section.maxMarks ??
        section.correct + section.incorrect + section.skipped;
    }

    const percentage =
      maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;

    const accuracy =
      totalAttempted > 0
        ? Math.round((totalCorrect / totalAttempted) * 100)
        : 0;

    // Objective score split
    const objectiveScore = objectiveEvalResults.reduce(
      (s, r) => s + r.score,
      0,
    );
    const objectiveMaxMarks = objectiveEvalResults.reduce(
      (s, r) => s + r.maxMarks,
      0,
    );

    // Coding score split
    const codingScore = codingEvalResults.reduce((s, r) => s + r.score, 0);
    const codingMaxMarks = codingEvalResults.reduce(
      (s, r) => s + r.maxMarks,
      0,
    );

    const passed = percentage >= PASS_PERCENTAGE_THRESHOLD;

    return {
      totalMarks,
      percentage,
      accuracy,
      normalizedScore: percentage,
      // Enriched fields
      maxMarks,
      objectiveScore,
      codingScore,
      objectiveMaxMarks,
      codingMaxMarks,
      passed,
    };
  }
}
