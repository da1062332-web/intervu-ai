import { Injectable } from "@nestjs/common";
import { PerformanceAnalyticsDto } from "@intervu-ai/contracts";

export interface StrengthWeaknessResult {
  strengths: string[];
  weaknesses: string[];
}

@Injectable()
export class StrengthWeaknessService {
  /**
   * Identifies candidate strengths and weaknesses based on accuracy thresholds.
   * Threshold: >= 75% for Strengths, < 75% for Weaknesses.
   */
  determineStrengthsAndWeaknesses(analytics: PerformanceAnalyticsDto): StrengthWeaknessResult {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // Analyze topics
    for (const [topic, accuracy] of Object.entries(analytics.topicAccuracy)) {
      if (accuracy >= 75) {
        strengths.push(topic);
      } else {
        weaknesses.push(topic);
      }
    }

    // Analyze sections if needed, but the spec says "Strengths: [], Weaknesses: []"
    // Usually, we focus on topics. Let's keep it topic-focused but sort them alphabetically.
    strengths.sort();
    weaknesses.sort();

    return {
      strengths,
      weaknesses,
    };
  }
}
