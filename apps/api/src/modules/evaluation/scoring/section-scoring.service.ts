import { Injectable } from "@nestjs/common";
import { SectionScoreDto } from "@intervu-ai/contracts";
import { QuestionEvaluationResult } from "../objective/objective-evaluator.service";

@Injectable()
export class SectionScoringService {
  /**
   * Computes section-wise scores including enriched fields:
   * totalQuestions, attempted, maxMarks, percentage, accuracy.
   */
  calculateSectionScores(
    evalResults: QuestionEvaluationResult[],
    sections: Array<{
      id: string;
      sectionKey: string;
      sectionName: string;
      questions: Array<{ questionId: string }>;
    }>,
  ): SectionScoreDto[] {
    const scores: SectionScoreDto[] = [];

    for (const section of sections) {
      const sectionQuestionIds = new Set(
        section.questions.map((q) => q.questionId),
      );
      const sectionResults = evalResults.filter((r) =>
        sectionQuestionIds.has(r.questionId),
      );

      let correct = 0;
      let incorrect = 0;
      let skipped = 0;
      let marksObtained = 0;
      let maxMarks = 0;

      for (const result of sectionResults) {
        maxMarks += result.maxMarks;
        marksObtained += result.score;
        if (result.isCorrect) {
          correct += 1;
        } else if (
          !result.candidateAnswer ||
          result.candidateAnswer.trim() === ""
        ) {
          skipped += 1;
        } else {
          incorrect += 1;
        }
      }

      const totalQuestions = sectionResults.length;
      const attempted = correct + incorrect;
      const accuracy =
        attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
      const percentage =
        maxMarks > 0 ? Math.round((marksObtained / maxMarks) * 100) : 0;

      scores.push({
        sectionKey: section.sectionKey,
        sectionName: section.sectionName,
        correct,
        incorrect,
        skipped,
        marks: marksObtained,
        accuracy,
        // Enriched fields
        totalQuestions,
        attempted,
        maxMarks,
        percentage,
      });
    }

    return scores;
  }
}
