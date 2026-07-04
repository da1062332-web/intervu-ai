import { ExecutionResult } from "@intervu-ai/contracts";

export interface SimulatedAttempt {
  executionResult: ExecutionResult;
  questions: Array<{
    id: string;
    answer: string;
    questionType: string;
    difficulty: string;
    topicName: string;
    sectionKey: string;
    sectionName: string;
  }>;
  expected: {
    percentage: number;
    score: number;
    sectionScores: Record<string, { correct: number; total: number; score: number }>;
    topicScores: Record<string, { correct: number; total: number; accuracy: number }>;
    difficultyScores: Record<string, { correct: number; total: number; accuracy: number }>;
    completionRate: number;
    totalTimeSpent: number;
  };
}

export class ExpectedResultGenerator {
  /**
   * Generates a stable list of mock questions covering various topics and difficulties.
   */
  private generateMockQuestions(count = 10, sectionMode = "single", difficultyMode = "mixed") {
    const questions = [];
    const topics = ["Quantitative Aptitude", "Logical Reasoning", "Verbal Ability"];
    const difficulties = ["EASY", "MEDIUM", "HARD"];

    for (let i = 0; i < count; i++) {
      const qId = `q_val_${i}`;
      let difficulty = "MEDIUM";
      if (difficultyMode === "easy") difficulty = "EASY";
      else if (difficultyMode === "hard") difficulty = "HARD";
      else {
        difficulty = difficulties[i % difficulties.length];
      }

      let sectionKey = "sec_general";
      let sectionName = "General Section";
      if (sectionMode === "sectional") {
        const secIndex = i % 3;
        sectionKey = `sec_${secIndex}`;
        sectionName = `${topics[secIndex]} Section`;
      }

      const questionType = i % 4 === 0 ? "MCQ" : i % 4 === 1 ? "MSQ" : i % 4 === 2 ? "TrueFalse" : "Numeric";
      let answer = "OptionA";
      if (questionType === "MSQ") answer = "OptionA,OptionB";
      else if (questionType === "TrueFalse") answer = "true";
      else if (questionType === "Numeric") answer = "10.5";

      questions.push({
        id: qId,
        answer,
        questionType,
        difficulty,
        topicName: topics[i % topics.length],
        sectionKey,
        sectionName,
      });
    }

    return questions;
  }

  /**
   * Generates 2,000 simulated attempts.
   */
  generateDataset(count = 2000): SimulatedAttempt[] {
    const dataset: SimulatedAttempt[] = [];

    for (let i = 0; i < count; i++) {
      const sectionMode = i % 3 === 0 ? "sectional" : "single";
      const difficultyMode = i % 4 === 0 ? "easy" : i % 4 === 1 ? "medium" : i % 4 === 2 ? "hard" : "mixed";
      const qCount = 5 + (i % 6); // 5 to 10 questions

      const questions = this.generateMockQuestions(qCount, sectionMode, difficultyMode);
      const answers: Array<{
        questionId: string;
        answer: string;
        timeSpentSeconds?: number;
        isMarkedForReview?: boolean;
      }> = [];
      let totalCorrect = 0;
      let totalTimeSpent = 0;
      let answeredCount = 0;

      const sectionStats: Record<string, { correct: number; total: number }> = {};
      const topicStats: Record<string, { correct: number; total: number }> = {};
      const difficultyStats: Record<string, { correct: number; total: number }> = {};

      questions.forEach((q, idx) => {
        if (!sectionStats[q.sectionName]) sectionStats[q.sectionName] = { correct: 0, total: 0 };
        if (!topicStats[q.topicName]) topicStats[q.topicName] = { correct: 0, total: 0 };
        if (!difficultyStats[q.difficulty]) difficultyStats[q.difficulty] = { correct: 0, total: 0 };

        sectionStats[q.sectionName].total++;
        topicStats[q.topicName].total++;
        difficultyStats[q.difficulty].total++;

        let isCorrect = false;
        let answerVal = "";
        let isAnswered = false;
        const timeSpent = 10 + (idx * 5);
        totalTimeSpent += timeSpent;

        if (i % 3 === 0) {
          isCorrect = true;
          isAnswered = true;
          if (q.questionType === "MSQ") {
            answerVal = JSON.stringify(["OptionA", "OptionB"]);
          } else {
            answerVal = q.answer;
          }
        } else if (i % 3 === 1) {
          isCorrect = false;
          isAnswered = true;
          answerVal = "WrongOption";
        } else {
          if (idx % 2 === 0) {
            isCorrect = true;
            isAnswered = true;
            if (q.questionType === "MSQ") {
              answerVal = JSON.stringify(["OptionA", "OptionB"]);
            } else {
              answerVal = q.answer;
            }
          } else {
            isCorrect = false;
            if (idx % 4 === 1) {
              isAnswered = false;
              answerVal = "";
            } else {
              isAnswered = true;
              answerVal = "WrongOption";
            }
          }
        }

        if (isCorrect) {
          totalCorrect++;
          sectionStats[q.sectionName].correct++;
          topicStats[q.topicName].correct++;
          difficultyStats[q.difficulty].correct++;
        }

        if (isAnswered) {
          answeredCount++;
        }

        answers.push({
          questionId: q.id,
          answer: answerVal,
          timeSpentSeconds: timeSpent,
          isMarkedForReview: false,
        });
      });

      const percentage = Math.round((totalCorrect / qCount) * 100);
      const completionRate = Math.round((answeredCount / qCount) * 100);

      const sectionScores: Record<string, { correct: number; total: number; score: number }> = {};
      Object.entries(sectionStats).forEach(([name, stats]) => {
        sectionScores[name] = {
          correct: stats.correct,
          total: stats.total,
          score: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        };
      });

      const topicScores: Record<string, { correct: number; total: number; accuracy: number }> = {};
      Object.entries(topicStats).forEach(([name, stats]) => {
        topicScores[name] = {
          correct: stats.correct,
          total: stats.total,
          accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        };
      });

      const difficultyScores: Record<string, { correct: number; total: number; accuracy: number }> = {};
      Object.entries(difficultyStats).forEach(([name, stats]) => {
        difficultyScores[name] = {
          correct: stats.correct,
          total: stats.total,
          accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        };
      });

      dataset.push({
        executionResult: {
          executionId: `exec_val_${i}`,
          testId: `test_val_${i}`,
          status: "submitted",
          answers,
          submittedAt: new Date(),
        },
        questions,
        expected: {
          percentage,
          score: totalCorrect,
          sectionScores,
          topicScores,
          difficultyScores,
          completionRate,
          totalTimeSpent,
        },
      });
    }

    return dataset;
  }
}
