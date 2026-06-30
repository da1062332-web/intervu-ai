import { Injectable } from "@nestjs/common";
import { RecommendationDto } from "@intervu-ai/contracts";
import { PerformanceAnalyticsDto } from "@intervu-ai/contracts";
import { randomUUID } from "crypto";

@Injectable()
export class RecommendationService {
  private readonly conceptToSkillMap: Record<string, string> = {
    time_work: "aptitude",
    "Time and Work": "aptitude",
    percentages: "aptitude",
    Percentages: "aptitude",
    averages: "aptitude",
    Averages: "aptitude",
    profit_loss: "aptitude",
    "Profit and Loss": "aptitude",
    probability: "reasoning",
    Probability: "reasoning",
  };

  /**
   * Generates recommendations based on topic-wise performance.
   */
  generateRecommendations(
    analytics: PerformanceAnalyticsDto,
  ): RecommendationDto[] {
    const recommendations: RecommendationDto[] = [];

    for (const [topic, accuracy] of Object.entries(analytics.topicAccuracy)) {
      if (accuracy < 75) {
        const skill = this.conceptToSkillMap[topic] || "general";
        const priority = accuracy < 50 ? "HIGH" : "MEDIUM";

        recommendations.push({
          recommendationId: `rec_${randomUUID()}`,
          skill,
          priority,
          title: `Improve ${topic}`,
          description: `Your accuracy in ${topic} is ${accuracy}%. Focus on reviewing the core concepts and practice medium difficulty problems to improve verbal and calculation accuracy.`,
        });
      }
    }

    // Default recommendation if the candidate performed perfectly
    if (recommendations.length === 0) {
      recommendations.push({
        recommendationId: `rec_${randomUUID()}`,
        skill: "general",
        priority: "LOW",
        title: "Maintain Excellence",
        description:
          "Great job! You achieved 75% or higher accuracy across all topics. Keep practicing to maintain your proficiency.",
      });
    }

    return recommendations;
  }
}
