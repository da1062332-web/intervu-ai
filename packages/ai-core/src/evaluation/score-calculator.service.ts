import { CandidateAnswer } from "@intervu-ai/contracts";

export interface QuestionSnapshot {
  questionId: string;
  correctAnswer: string;
  questionType: string;
  conceptKey: string;
  difficultyLevel: string;
}

export class ScoreCalculatorService {
  /**
   * Compares a candidate's answer with the expected correct answer.
   */
  compareAnswers(candidate: string, expected: string, type: string): boolean {
    const cleanCandidate = (candidate ?? "").trim();
    const cleanExpected = (expected ?? "").trim();

    if (type === "numeric") {
      const candNum = parseFloat(cleanCandidate);
      const expNum = parseFloat(cleanExpected);
      if (isNaN(candNum) || isNaN(expNum)) {
        return false;
      }
      return Math.abs(candNum - expNum) < 0.0001;
    }

    // Default: Trimmed case-insensitive comparison for MCQ and others
    return cleanCandidate.toLowerCase() === cleanExpected.toLowerCase();
  }

  /**
   * Calculates the overall score.
   * Rules: Correct Answer = +1, Wrong Answer = 0.
   * Returns a percentage score out of 100: (Correct / Total) * 100.
   */
  calculateScore(
    answers: CandidateAnswer[],
    questionsMap: Record<string, QuestionSnapshot>,
  ): {
    overallScore: number;
    rawScore: number;
    totalQuestions: number;
    breakdown: Record<string, { isCorrect: boolean; points: number }>;
  } {
    let rawScore = 0;
    const breakdown: Record<string, { isCorrect: boolean; points: number }> =
      {};

    const totalQuestions = Object.keys(questionsMap).length;
    if (totalQuestions === 0) {
      return { overallScore: 0, rawScore: 0, totalQuestions: 0, breakdown };
    }

    for (const [questionId, question] of Object.entries(questionsMap)) {
      const candAnswerObj = answers.find((a) => a.questionId === questionId);
      const candAnswer = candAnswerObj ? candAnswerObj.answer : "";

      const isCorrect = this.compareAnswers(
        candAnswer,
        question.correctAnswer,
        question.questionType,
      );

      const points = isCorrect ? 1 : 0;
      if (isCorrect) {
        rawScore += 1;
      }

      breakdown[questionId] = {
        isCorrect,
        points,
      };
    }

    const overallScore = Math.round((rawScore / totalQuestions) * 100);

    return {
      overallScore,
      rawScore,
      totalQuestions,
      breakdown,
    };
  }
}
