import { z } from "zod";

export const EvaluationMetadataSchema = z.object({
  questionId: z.string(),
  difficultyWeight: z.number(),
  correctAnswer: z.string(),
});

export const EvaluationRequestSchema = z.object({
  questionId: z.string(),
  selectedOption: z.string(),
  timeTakenSeconds: z.number().min(0),
  metadata: EvaluationMetadataSchema,
});

export const EvaluationResultSchema = z.object({
  isCorrect: z.boolean(),
  baseScore: z.number().min(0),
  timeBonus: z.number().min(0),
  finalScore: z.number().min(0),
  confidenceScore: z.number().min(0).max(1),
  evaluationMetadata: EvaluationMetadataSchema,
  issues: z.array(z.string()),
});

export type EvaluationMetadata = z.infer<typeof EvaluationMetadataSchema>;
export type EvaluationRequest = z.infer<typeof EvaluationRequestSchema>;
export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;

export interface EvaluationRun {
  questionId: string;
  isCorrect: boolean;
  hasMismatch: boolean;
  hasScoreAnomaly: boolean;
  isConsistent: boolean;
  timestamp: Date;
}

export interface EvaluationAnalyticsReport {
  totalEvaluations: number;
  correctnessRate: number;
  runtimeMismatches: number;
  duplicateScoreAnomalies: number;
  evaluationConsistencyRate: number;
}
