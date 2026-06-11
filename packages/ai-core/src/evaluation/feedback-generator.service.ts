import { QuestionSnapshot } from "./score-calculator.service";

export class FeedbackGeneratorService {
  private readonly conceptDisplayNames: Record<string, string> = {
    time_work: "Time and Work",
    probability: "Probability",
    percentages: "Percentages",
    averages: "Averages",
    profit_loss: "Profit and Loss",
  };

  /**
   * Capitalizes and formats unknown concept keys.
   */
  private formatConceptName(key: string): string {
    if (this.conceptDisplayNames[key]) {
      return this.conceptDisplayNames[key];
    }
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * Generates deterministic rule-based feedback.
   * Target: >= 75% correct is "Strong in <Concept>.", otherwise "Needs improvement in <Concept>."
   */
  generateFeedback(
    questionsMap: Record<string, QuestionSnapshot>,
    breakdown: Record<string, { isCorrect: boolean; points: number }>
  ): string[] {
    const conceptStats: Record<string, { correct: number; total: number }> = {};

    for (const [questionId, question] of Object.entries(questionsMap)) {
      const concept = question.conceptKey;
      const result = breakdown[questionId];
      const isCorrect = result ? result.isCorrect : false;

      if (!conceptStats[concept]) {
        conceptStats[concept] = { correct: 0, total: 0 };
      }
      conceptStats[concept].total += 1;
      if (isCorrect) {
        conceptStats[concept].correct += 1;
      }
    }

    const feedback: string[] = [];

    // Order alphabetically by concept key for determinism
    const sortedConcepts = Object.keys(conceptStats).sort();

    for (const concept of sortedConcepts) {
      const stats = conceptStats[concept];
      if (stats.total > 0) {
        const percentage = (stats.correct / stats.total) * 100;
        const conceptName = this.formatConceptName(concept);
        if (percentage >= 75) {
          feedback.push(`Strong in ${conceptName}.`);
        } else {
          feedback.push(`Needs improvement in ${conceptName}.`);
        }
      }
    }

    return feedback;
  }
}
