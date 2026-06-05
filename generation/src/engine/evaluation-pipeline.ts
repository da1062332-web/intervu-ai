import {
  EvaluationMetadata,
  EvaluationRequest,
  EvaluationRequestSchema,
  EvaluationResult,
  EvaluationRun,
  EvaluationAnalyticsReport,
} from '../types/evaluation.types';

export class EvaluationAnalyticsTracker {
  private evaluations: EvaluationRun[] = [];

  recordEvaluation(run: EvaluationRun): void {
    this.evaluations.push(run);
  }

  getAnalytics(): EvaluationAnalyticsReport {
    const total = this.evaluations.length;
    if (total === 0) {
      return {
        totalEvaluations: 0,
        correctnessRate: 0,
        runtimeMismatches: 0,
        duplicateScoreAnomalies: 0,
        evaluationConsistencyRate: 0,
      };
    }
    const correctCount = this.evaluations.filter((e) => e.isCorrect).length;
    const mismatches = this.evaluations.filter((e) => e.hasMismatch).length;
    const anomalies = this.evaluations.filter((e) => e.hasScoreAnomaly).length;
    const consistent = this.evaluations.filter((e) => e.isConsistent).length;

    return {
      totalEvaluations: total,
      correctnessRate: Math.round((correctCount / total) * 100) / 100,
      runtimeMismatches: mismatches,
      duplicateScoreAnomalies: anomalies,
      evaluationConsistencyRate: Math.round((consistent / total) * 100) / 100,
    };
  }

  getEvaluations(): EvaluationRun[] {
    return this.evaluations;
  }

  clear(): void {
    this.evaluations = [];
  }
}

// Global in-memory tracker instance for runtime evaluation analytics
export const evaluationAnalytics = new EvaluationAnalyticsTracker();

// Memory cache to track duplicate submission anomalies
const submissionCache = new Map<string, { selectedOption: string; timestamp: number }>();

/**
 * Validates a candidate's response against the question metadata and generates a detailed score and metrics report.
 * 
 * @param rawPayload The raw evaluation payload to be parsed and verified.
 * @param optionsList Optional list of the 4 choice options presented to the user.
 * @returns EvaluationResult
 */
export function evaluateResponse(
  rawPayload: unknown,
  optionsList?: string[]
): EvaluationResult {
  const issues: string[] = [];
  let isCorrect = false;
  let hasMismatch = false;
  let hasScoreAnomaly = false;
  let isConsistent = true;

  // 1. Payload Schema Validation
  const parseResult = EvaluationRequestSchema.safeParse(rawPayload);
  if (!parseResult.success) {
    hasMismatch = true;
    const errorMsg = `Payload schema validation failed: ${parseResult.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ')}`;
    
    const fallbackMetadata: EvaluationMetadata = {
      questionId: typeof rawPayload === 'object' && rawPayload !== null && 'questionId' in rawPayload && typeof (rawPayload as Record<string, unknown>).questionId === 'string'
        ? (rawPayload as Record<string, unknown>).questionId as string
        : 'unknown',
      difficultyWeight: 1,
      correctAnswer: 'unknown',
    };

    const result: EvaluationResult = {
      isCorrect: false,
      baseScore: 0,
      timeBonus: 0,
      finalScore: 0,
      confidenceScore: 0,
      evaluationMetadata: fallbackMetadata,
      issues: [errorMsg],
    };

    evaluationAnalytics.recordEvaluation({
      questionId: fallbackMetadata.questionId,
      isCorrect: false,
      hasMismatch: true,
      hasScoreAnomaly: false,
      isConsistent: false,
      timestamp: new Date(),
    });

    return result;
  }

  const payload: EvaluationRequest = parseResult.data;
  const { questionId, selectedOption, timeTakenSeconds, metadata } = payload;

  // 2. Option Consistency & Mismatch Verification
  if (optionsList) {
    if (optionsList.length !== 4) {
      hasMismatch = true;
      issues.push(`Runtime option consistency error: expected 4 options, got ${optionsList.length}`);
    } else {
      if (!optionsList.includes(selectedOption)) {
        hasMismatch = true;
        issues.push(`Runtime option consistency error: selected option '${selectedOption}' not present in options list`);
      }
      if (!optionsList.includes(metadata.correctAnswer)) {
        hasMismatch = true;
        issues.push(`Runtime option consistency error: correct answer '${metadata.correctAnswer}' not present in options list`);
      }
    }
  }

  // 3. Correct Answer Verification
  isCorrect = selectedOption === metadata.correctAnswer;

  // 4. Scoring Calculations
  const baseScore = isCorrect ? metadata.difficultyWeight * 10 : 0;
  
  // Calculate Time Bonus: only eligible if answer is correct
  let timeBonus = 0;
  if (isCorrect && timeTakenSeconds > 0) {
    if (timeTakenSeconds < 10) {
      timeBonus = 5;
    } else if (timeTakenSeconds < 20) {
      timeBonus = 3;
    } else if (timeTakenSeconds < 30) {
      timeBonus = 1;
    }
  }

  const finalScore = baseScore + timeBonus;

  // 5. Confidence/Guess-Detection Heuristics
  let confidenceScore = 1.0;
  if (timeTakenSeconds < 2) {
    confidenceScore = 0.1; // Flagged: highly likely to be a fast guess or cheat
    issues.push(`Suspiciously low response time (${timeTakenSeconds}s): confidence flagged`);
  } else if (timeTakenSeconds < 5) {
    confidenceScore = 0.5; // Marginally fast response time
  } else if (!isCorrect) {
    confidenceScore = 0.8; // User spent time but got it wrong
  }

  // 6. Duplicate Score Anomaly Check
  const now = Date.now();
  const cached = submissionCache.get(questionId);
  if (cached && cached.selectedOption === selectedOption && (now - cached.timestamp) < 5000) {
    hasScoreAnomaly = true;
    issues.push(`Duplicate submission anomaly: identical response received within 5 seconds for question ${questionId}`);
  }
  submissionCache.set(questionId, { selectedOption, timestamp: now });

  // 7. Evaluation Consistency Check
  // The calculated final score must equal baseScore + timeBonus, and difficulty weight must be in range [1, 3]
  if (finalScore !== baseScore + timeBonus || metadata.difficultyWeight < 1 || metadata.difficultyWeight > 3) {
    isConsistent = false;
    issues.push(`Evaluation inconsistency: invalid score computation or difficulty weight out of bounds`);
  }

  // 8. Record in Analytics Tracker
  evaluationAnalytics.recordEvaluation({
    questionId,
    isCorrect,
    hasMismatch,
    hasScoreAnomaly,
    isConsistent,
    timestamp: new Date(),
  });

  return {
    isCorrect,
    baseScore,
    timeBonus,
    finalScore,
    confidenceScore,
    evaluationMetadata: metadata,
    issues,
  };
}
