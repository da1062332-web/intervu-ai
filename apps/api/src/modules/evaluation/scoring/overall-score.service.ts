import { Injectable } from "@nestjs/common";
import { OverallScoreDto, SectionScoreDto } from "@intervu-ai/contracts";

@Injectable()
export class OverallScoreService {
  /**
   * Calculates overall scoring metrics from section scores.
   */
  calculateOverallScore(sectionScores: SectionScoreDto[]): OverallScoreDto {
    let totalMarks = 0;
    let totalCorrect = 0;
    let totalQuestions = 0;
    let totalAttempted = 0;

    for (const section of sectionScores) {
      totalMarks += section.marks;
      totalCorrect += section.correct;
      totalQuestions += section.correct + section.incorrect + section.skipped;
      totalAttempted += section.correct + section.incorrect;
    }

    const percentage =
      totalQuestions > 0
        ? Math.round((totalCorrect / totalQuestions) * 100)
        : 0;
    const accuracy =
      totalAttempted > 0
        ? Math.round((totalCorrect / totalAttempted) * 100)
        : 0;
    const normalizedScore = percentage; // Default normalization out of 100%

    return {
      totalMarks,
      percentage,
      accuracy,
      normalizedScore,
    };
  }
}
