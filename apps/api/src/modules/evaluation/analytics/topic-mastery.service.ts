import { Injectable } from "@nestjs/common";

export type TopicMasteryLevel = "Mastered" | "Proficient" | "Developing" | "Weak";

@Injectable()
export class TopicMasteryService {
  /**
   * Computes topic mastery levels based on accuracy percentages.
   */
  calculateTopicMastery(topicAccuracy: Record<string, number>): Record<string, TopicMasteryLevel> {
    const topicMastery: Record<string, TopicMasteryLevel> = {};

    Object.entries(topicAccuracy).forEach(([topic, accuracy]) => {
      if (accuracy >= 90) {
        topicMastery[topic] = "Mastered";
      } else if (accuracy >= 75) {
        topicMastery[topic] = "Proficient";
      } else if (accuracy >= 50) {
        topicMastery[topic] = "Developing";
      } else {
        topicMastery[topic] = "Weak";
      }
    });

    return topicMastery;
  }
}
