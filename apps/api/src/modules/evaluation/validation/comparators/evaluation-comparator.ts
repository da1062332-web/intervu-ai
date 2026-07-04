import { CandidateResultDto } from "@intervu-ai/contracts";
import { SimulatedAttempt } from "../fixtures/expected-result-generator";

export interface ComparisonResult {
  passed: boolean;
  errors: string[];
}

export class EvaluationComparator {
  /**
   * Compares the actual CandidateResultDto with the expected metrics in the simulated attempt.
   */
  compare(
    actual: CandidateResultDto,
    attempt: SimulatedAttempt,
  ): ComparisonResult {
    const errors: string[] = [];
    const expected = attempt.expected;

    // 1. Overall Score comparison
    if (actual.score !== expected.score) {
      errors.push(
        `Score mismatch: expected ${expected.score}, got ${actual.score}`,
      );
    }
    if (actual.percentage !== expected.percentage) {
      errors.push(
        `Percentage mismatch: expected ${expected.percentage}%, got ${actual.percentage}%`,
      );
    }

    // 2. Section Scores comparison
    const actualSections = actual.sections || [];
    Object.entries(expected.sectionScores).forEach(([sectionName, expSec]) => {
      // Find matching actual section (by sectionName or sectionKey)
      const actSec = actualSections.find(
        (s) =>
          s.sectionName === sectionName ||
          s.sectionKey === sectionName ||
          s.sectionKey.replace("sec_", "") ===
            sectionName.split(" ")[0].toLowerCase(),
      );

      if (!actSec) {
        errors.push(`Section missing in actual results: ${sectionName}`);
      } else {
        if (actSec.correct !== expSec.correct) {
          errors.push(
            `Section "${sectionName}" correct count mismatch: expected ${expSec.correct}, got ${actSec.correct}`,
          );
        }
        if (actSec.accuracy !== expSec.score) {
          errors.push(
            `Section "${sectionName}" accuracy mismatch: expected ${expSec.score}%, got ${actSec.accuracy}%`,
          );
        }
      }
    });

    // 3. Analytics Comparison (Topic Accuracies)
    const actualTopics = actual.analytics?.topicAccuracy || {};
    Object.entries(expected.topicScores).forEach(([topicName, expTop]) => {
      const actAcc = actualTopics[topicName];
      if (actAcc === undefined) {
        errors.push(`Topic missing in actual analytics: ${topicName}`);
      } else if (actAcc !== expTop.accuracy) {
        errors.push(
          `Topic "${topicName}" accuracy mismatch: expected ${expTop.accuracy}%, got ${actAcc}%`,
        );
      }
    });

    // 4. Analytics Comparison (Difficulty Accuracies)
    const actualDifficulties = actual.analytics?.difficultyAccuracy || {};
    Object.entries(expected.difficultyScores).forEach(
      ([difficulty, expDiff]) => {
        const actAcc = actualDifficulties[difficulty];
        if (actAcc === undefined) {
          errors.push(
            `Difficulty level missing in actual analytics: ${difficulty}`,
          );
        } else if (actAcc !== expDiff.accuracy) {
          errors.push(
            `Difficulty "${difficulty}" accuracy mismatch: expected ${expDiff.accuracy}%, got ${actAcc}%`,
          );
        }
      },
    );

    // 5. Completion Rate
    if (actual.analytics) {
      if (actual.analytics.completionRate !== expected.completionRate) {
        errors.push(
          `Completion rate mismatch: expected ${expected.completionRate}%, got ${actual.analytics.completionRate}%`,
        );
      }
    } else {
      errors.push("Analytics section is missing from actual results");
    }

    return {
      passed: errors.length === 0,
      errors,
    };
  }
}
