import { Injectable } from "@nestjs/common";
import { SectionScoreDto } from "@intervu-ai/contracts";
import { QuestionEvaluationResult } from "../objective/objective-evaluator.service";

@Injectable()
export class SectionScoringService {
  /**
   * Computes section-wise scores.
   * Maps questions in each section to evaluate correct, incorrect, skipped, marks, and accuracy.
   */
  calculateSectionScores(
    evalResults: QuestionEvaluationResult[],
    sections: Array<{ id: string; sectionKey: string; sectionName: string; questions: Array<{ questionId: string }> }>,
  ): SectionScoreDto[] {
    const scores: SectionScoreDto[] = [];

    for (const section of sections) {
      const sectionQuestionIds = new Set(section.questions.map((q) => q.questionId));
      const sectionResults = evalResults.filter((r) => sectionQuestionIds.has(r.questionId));

      let correct = 0;
      let incorrect = 0;
      let skipped = 0;
      let marks = 0;

      for (const result of sectionResults) {
        if (result.isCorrect) {
          correct += 1;
          marks += result.score;
        } else if (!result.candidateAnswer || result.candidateAnswer.trim() === "") {
          skipped += 1;
        } else {
          incorrect += 1;
        }
      }

      const totalQuestions = sectionResults.length;
      const accuracy = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

      scores.push({
        sectionKey: section.sectionKey,
        sectionName: section.sectionName,
        correct,
        incorrect,
        skipped,
        marks,
        accuracy,
      });
    }

    return scores;
  }
}
