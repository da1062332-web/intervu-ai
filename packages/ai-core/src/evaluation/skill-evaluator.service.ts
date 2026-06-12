import { QuestionSnapshot } from "./score-calculator.service";

export class SkillEvaluatorService {
  // Configurable concept-to-skills mapping.
  // Using array values in case a concept maps to multiple skills.
  private readonly conceptToSkillsMap: Record<string, string[]> = {
    time_work: ["aptitude"],
    percentages: ["aptitude"],
    averages: ["aptitude"],
    profit_loss: ["aptitude"],
    probability: ["reasoning"],
  };

  /**
   * Calculates scores for each skill based on the candidate's correctness breakdown.
   */
  evaluateSkills(
    questionsMap: Record<string, QuestionSnapshot>,
    breakdown: Record<string, { isCorrect: boolean; points: number }>,
  ): Record<string, number> {
    const skillStats: Record<string, { correct: number; total: number }> = {};

    for (const [questionId, question] of Object.entries(questionsMap)) {
      const concept = question.conceptKey;
      const skills = this.conceptToSkillsMap[concept] || ["general"];

      const result = breakdown[questionId];
      const isCorrect = result ? result.isCorrect : false;

      for (const skill of skills) {
        if (!skillStats[skill]) {
          skillStats[skill] = { correct: 0, total: 0 };
        }
        skillStats[skill].total += 1;
        if (isCorrect) {
          skillStats[skill].correct += 1;
        }
      }
    }

    const skillScores: Record<string, number> = {};
    for (const [skill, stats] of Object.entries(skillStats)) {
      if (stats.total > 0) {
        skillScores[skill] = Math.round((stats.correct / stats.total) * 100);
      }
    }

    return skillScores;
  }
}
