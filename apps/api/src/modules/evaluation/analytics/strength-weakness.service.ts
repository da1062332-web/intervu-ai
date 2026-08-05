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
   * BUG-005 fix: When completionRate is 0 (all skipped) or all topics have 0% accuracy,
   * no strengths are generated — skipped questions must not count as strengths.
   */
  determineStrengthsAndWeaknesses(
    analytics: PerformanceAnalyticsDto,
  ): StrengthWeaknessResult {
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // BUG-005: If nothing was attempted/completed, return no strengths
    const completionRate = analytics.completionRate ?? 100;
    const allTopicAccuracies = Object.values(analytics.topicAccuracy);
    const allSkipped =
      completionRate === 0 ||
      (allTopicAccuracies.length > 0 &&
        allTopicAccuracies.every((acc) => acc === 0));

    if (allSkipped) {
      // Everything was skipped — all topics are weaknesses, no strengths
      for (const topic of Object.keys(analytics.topicAccuracy)) {
        weaknesses.push(topic);
      }
      weaknesses.sort();
      return { strengths, weaknesses };
    }

    // Normal case: analyze topics against accuracy thresholds
    for (const [topic, accuracy] of Object.entries(analytics.topicAccuracy)) {
      if (accuracy >= 75) {
        strengths.push(topic);
      } else {
        weaknesses.push(topic);
      }
    }

    // Sort alphabetically for consistency
    strengths.sort();
    weaknesses.sort();

    return {
      strengths,
      weaknesses,
    };
  }
}
