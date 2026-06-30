import { Injectable } from "@nestjs/common";
import { PerformanceAnalyticsDto } from "@intervu-ai/contracts";
import { QuestionEvaluationResult } from "../objective/objective-evaluator.service";

@Injectable()
export class PerformanceAnalyticsService {
  /**
   * Generates performance analytics metrics.
   */
  calculateAnalytics(
    evalResults: QuestionEvaluationResult[],
    questions: Array<{
      id: string;
      topicName: string;
      difficulty: string;
      sectionKey: string;
    }>,
  ): PerformanceAnalyticsDto {
    const topicStats: Record<string, { correct: number; total: number }> = {};
    const difficultyStats: Record<string, { correct: number; total: number }> =
      {};
    const sectionStats: Record<string, { correct: number; total: number }> = {};

    let answeredCount = 0;
    let attemptedCount = 0;
    const totalQuestions = evalResults.length;

    for (const result of evalResults) {
      const question = questions.find((q) => q.id === result.questionId);
      const topicName = question ? question.topicName || "General" : "General";
      const difficulty = question ? question.difficulty || "MEDIUM" : "MEDIUM";
      const sectionKey = question
        ? question.sectionKey || "default"
        : "default";

      // answered means not empty/whitespace
      const isAnswered =
        result.candidateAnswer && result.candidateAnswer.trim() !== "";
      if (isAnswered) {
        answeredCount += 1;
      }

      // attempted = correct or incorrect
      const isAttempted = result.isCorrect || (isAnswered && !result.isCorrect);
      if (isAttempted) {
        attemptedCount += 1;
      }

      // Topic stats
      if (!topicStats[topicName]) {
        topicStats[topicName] = { correct: 0, total: 0 };
      }
      topicStats[topicName].total += 1;
      if (result.isCorrect) {
        topicStats[topicName].correct += 1;
      }

      // Difficulty stats
      const difficultyUpper = difficulty.toUpperCase();
      if (!difficultyStats[difficultyUpper]) {
        difficultyStats[difficultyUpper] = { correct: 0, total: 0 };
      }
      difficultyStats[difficultyUpper].total += 1;
      if (result.isCorrect) {
        difficultyStats[difficultyUpper].correct += 1;
      }

      // Section stats
      if (!sectionStats[sectionKey]) {
        sectionStats[sectionKey] = { correct: 0, total: 0 };
      }
      sectionStats[sectionKey].total += 1;
      if (result.isCorrect) {
        sectionStats[sectionKey].correct += 1;
      }
    }

    const topicAccuracy: Record<string, number> = {};
    for (const [topic, stats] of Object.entries(topicStats)) {
      topicAccuracy[topic] =
        stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    }

    const difficultyAccuracy: Record<string, number> = {};
    for (const [difficulty, stats] of Object.entries(difficultyStats)) {
      difficultyAccuracy[difficulty] =
        stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    }

    const sectionAccuracy: Record<string, number> = {};
    for (const [section, stats] of Object.entries(sectionStats)) {
      sectionAccuracy[section] =
        stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    }

    const completionRate =
      totalQuestions > 0
        ? Math.round((answeredCount / totalQuestions) * 100)
        : 0;
    const attemptRate =
      totalQuestions > 0
        ? Math.round((attemptedCount / totalQuestions) * 100)
        : 0;

    return {
      topicAccuracy,
      difficultyAccuracy,
      sectionAccuracy,
      completionRate,
      attemptRate,
    };
  }
}
