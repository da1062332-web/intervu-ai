import { z } from "zod";
import { RecommendationDtoSchema } from "./recommendation";

export const CandidateAnswerSchema = z.object({
  questionId: z.string().min(1, "questionId is required"),
  answer: z.string(),
});

export type CandidateAnswer = z.infer<typeof CandidateAnswerSchema>;

export const ExecutionResultSchema = z.object({
  executionId: z.string().min(1, "executionId is required"),
  testId: z.string().min(1, "testId is required"),
  status: z.string().default("submitted"),
  answers: z.array(CandidateAnswerSchema),
  submittedAt: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date()),
});

export type ExecutionResult = z.infer<typeof ExecutionResultSchema>;

export const EvaluationResultDtoSchema = z.object({
  evaluationId: z.string().min(1, "evaluationId is required"),
  overallScore: z.number().min(0).max(100),
  confidenceScore: z.number().min(0).max(100),
  skillScores: z.record(z.string(), z.number().min(0).max(100)),
  feedback: z.array(z.string()),
  evaluatedAt: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date()),
});

export type EvaluationResultDto = z.infer<typeof EvaluationResultDtoSchema>;

export const SectionScoreDtoSchema = z.object({
  sectionKey: z.string().min(1, "sectionKey is required"),
  sectionName: z.string().min(1, "sectionName is required"),
  correct: z.number().int().nonnegative(),
  incorrect: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  marks: z.number().nonnegative(),
  accuracy: z.number().min(0).max(100),
});

export type SectionScoreDto = z.infer<typeof SectionScoreDtoSchema>;

export const OverallScoreDtoSchema = z.object({
  totalMarks: z.number().nonnegative(),
  percentage: z.number().min(0).max(100),
  accuracy: z.number().min(0).max(100),
  normalizedScore: z.number().min(0).max(100),
});

export type OverallScoreDto = z.infer<typeof OverallScoreDtoSchema>;

export const PerformanceAnalyticsDtoSchema = z.object({
  topicAccuracy: z.record(z.string(), z.number().min(0).max(100)),
  difficultyAccuracy: z.record(z.string(), z.number().min(0).max(100)),
  sectionAccuracy: z.record(z.string(), z.number().min(0).max(100)),
  completionRate: z.number().min(0).max(100),
  attemptRate: z.number().min(0).max(100),
});

export type PerformanceAnalyticsDto = z.infer<
  typeof PerformanceAnalyticsDtoSchema
>;

export const CandidateResultDtoSchema = z.object({
  id: z.string().cuid(),
  candidateId: z.string().min(1, "candidateId is required"),
  attemptId: z.string().min(1, "attemptId is required"),
  score: z.number().nonnegative(),
  percentage: z.number().min(0).max(100),
  createdAt: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date()),
  sections: z.array(SectionScoreDtoSchema).optional(),
  analytics: PerformanceAnalyticsDtoSchema.optional(),
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  recommendations: z.array(RecommendationDtoSchema).optional(),
});

export type CandidateResultDto = z.infer<typeof CandidateResultDtoSchema>;

export const CandidateRankDtoSchema = z.object({
  rank: z.number().int().positive(),
  totalCandidates: z.number().int().positive(),
  percentile: z.number().min(0).max(100),
});

export type CandidateRankDto = z.infer<typeof CandidateRankDtoSchema>;

export const BenchmarkDtoSchema = z.object({
  candidate: z.number().min(0).max(100),
  assessmentAverage: z.number().min(0).max(100),
  sections: z.array(
    z.object({
      sectionKey: z.string(),
      sectionName: z.string(),
      candidateScore: z.number().min(0).max(100),
      averageScore: z.number().min(0).max(100),
    }),
  ),
  topics: z.array(
    z.object({
      topicName: z.string(),
      candidateAccuracy: z.number().min(0).max(100),
      averageAccuracy: z.number().min(0).max(100),
    }),
  ),
  difficulties: z.array(
    z.object({
      difficulty: z.string(),
      candidateAccuracy: z.number().min(0).max(100),
      averageAccuracy: z.number().min(0).max(100),
    }),
  ),
});

export type BenchmarkDto = z.infer<typeof BenchmarkDtoSchema>;

export const PlatformEvaluationAnalyticsDtoSchema = z.object({
  averageScore: z.number().min(0).max(100),
  averageAccuracy: z.number().min(0).max(100),
  topTopics: z.array(
    z.object({
      topicName: z.string(),
      averageAccuracy: z.number().min(0).max(100),
    }),
  ),
  weakestTopics: z.array(
    z.object({
      topicName: z.string(),
      averageAccuracy: z.number().min(0).max(100),
    }),
  ),
  completionRates: z.object({
    completionRate: z.number().min(0).max(100),
    attemptRate: z.number().min(0).max(100),
  }),
  assessmentPerformanceTrends: z.array(
    z.object({
      date: z.string(),
      averageScore: z.number().min(0).max(100),
      totalAttempts: z.number().int().nonnegative(),
    }),
  ),
});

export type PlatformEvaluationAnalyticsDto = z.infer<
  typeof PlatformEvaluationAnalyticsDtoSchema
>;

