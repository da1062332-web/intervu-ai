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
  // Enriched fields
  totalQuestions: z.number().int().nonnegative().optional(),
  attempted: z.number().int().nonnegative().optional(),
  maxMarks: z.number().nonnegative().optional(),
  percentage: z.number().min(0).max(100).optional(),
});

export type SectionScoreDto = z.infer<typeof SectionScoreDtoSchema>;

export const OverallScoreDtoSchema = z.object({
  totalMarks: z.number().nonnegative(),
  percentage: z.number().min(0).max(100),
  accuracy: z.number().min(0).max(100),
  normalizedScore: z.number().min(0).max(100),
  // Enriched fields
  maxMarks: z.number().nonnegative().optional(),
  objectiveScore: z.number().nonnegative().optional(),
  codingScore: z.number().nonnegative().optional(),
  objectiveMaxMarks: z.number().nonnegative().optional(),
  codingMaxMarks: z.number().nonnegative().optional(),
  passed: z.boolean().optional(),
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

export const EvaluationExplanationSchema = z.object({
  scoreExplanation: z.string(),
  recommendationReason: z.string(),
  benchmarkReason: z.string(),
  rankingReason: z.string(),
});

export type EvaluationExplanation = z.infer<typeof EvaluationExplanationSchema>;

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
  explanations: EvaluationExplanationSchema.optional(),


  // Enriched result fields
  totalAttempted: z.number().int().nonnegative().optional(),
  totalCorrect: z.number().int().nonnegative().optional(),
  totalIncorrect: z.number().int().nonnegative().optional(),
  maxMarks: z.number().nonnegative().optional(),
  objectiveScore: z.number().nonnegative().optional(),
  codingScore: z.number().nonnegative().optional(),
  passed: z.boolean().optional(),

  // Hiring Qualification / Evaluation fields
  evaluationStrategy: z.string().optional(),
  qualification: z.string().optional(),
  qualificationReason: z.string().optional(),
  foundationScore: z.number().int().optional(),
  advancedScore: z.number().int().optional(),
  codingSolved: z.number().int().optional(),
  qualificationDetails: z.any().optional(),
  evaluatedAt: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date().optional()),
});

export type CandidateResultDto = z.infer<typeof CandidateResultDtoSchema>;

export const HiringSectionMappingDtoSchema = z.object({
  id: z.string().optional(),
  sectionCode: z.string().min(1, "sectionCode is required"),
  sectionName: z.string().optional(),
  mappingType: z.enum([
    "NUMERICAL",
    "VERBAL",
    "REASONING",
    "ADVANCED_APTITUDE",
    "CODING",
  ]),
  minimumCorrectAnswers: z.number().int().nonnegative().default(0),
});

export type HiringSectionMappingDto = z.infer<typeof HiringSectionMappingDtoSchema>;

export const HiringEvaluationConfigDtoSchema = z.object({
  id: z.string().optional(),
  examConfigId: z.string().min(1, "examConfigId is required"),
  strategy: z.enum(["TCS", "INFOSYS", "ACCENTURE", "CAPGEMINI", "COGNIZANT", "CUSTOM"]).default("TCS"),
  enabled: z.boolean().default(false),
  ninjaThreshold: z.number().int().nonnegative().default(0),
  digitalThreshold: z.number().int().nonnegative().default(0),
  primeThreshold: z.number().int().nonnegative().default(0),
  advancedDigitalMin: z.number().int().nonnegative().default(0),
  advancedPrimeMin: z.number().int().nonnegative().default(0),
  codingTotalProblems: z.number().int().nonnegative().default(0),
  codingDigitalMinSolved: z.number().int().nonnegative().default(0),
  codingPrimeMinSolved: z.number().int().nonnegative().default(0),
  sectionMappings: z.array(HiringSectionMappingDtoSchema).default([]),
});

export type HiringEvaluationConfigDto = z.infer<typeof HiringEvaluationConfigDtoSchema>;

export const SectionPassFailBreakdownSchema = z.object({
  category: z.string(),
  sectionCode: z.string(),
  sectionName: z.string().optional(),
  correctCount: z.number().int().nonnegative(),
  requiredMin: z.number().int().nonnegative(),
  passed: z.boolean(),
});

export type SectionPassFailBreakdown = z.infer<typeof SectionPassFailBreakdownSchema>;

export const FoundationBreakdownDtoSchema = z.object({
  numericalScore: z.number().int().nonnegative(),
  numericalMin: z.number().int().nonnegative(),
  verbalScore: z.number().int().nonnegative(),
  verbalMin: z.number().int().nonnegative(),
  reasoningScore: z.number().int().nonnegative(),
  reasoningMin: z.number().int().nonnegative(),
  foundationTotal: z.number().int().nonnegative(),
  ninjaThreshold: z.number().int().nonnegative(),
  digitalThreshold: z.number().int().nonnegative(),
  primeThreshold: z.number().int().nonnegative(),
  sectionsBreakdown: z.array(SectionPassFailBreakdownSchema),
});

export type FoundationBreakdownDto = z.infer<typeof FoundationBreakdownDtoSchema>;

export const AdvancedBreakdownDtoSchema = z.object({
  sectionCode: z.string().optional(),
  advancedScore: z.number().int().nonnegative(),
  advancedMinDigital: z.number().int().nonnegative(),
  advancedMinPrime: z.number().int().nonnegative(),
  passedDigital: z.boolean(),
  passedPrime: z.boolean(),
});

export type AdvancedBreakdownDto = z.infer<typeof AdvancedBreakdownDtoSchema>;

export const CodingProblemSummarySchema = z.object({
  problemId: z.string(),
  problemTitle: z.string().optional(),
  scorePercentage: z.number().min(0).max(100),
  status: z.enum(["SOLVED", "PARTIAL", "FAILED"]),
});

export type CodingProblemSummary = z.infer<typeof CodingProblemSummarySchema>;

export const CodingBreakdownDtoSchema = z.object({
  totalCodingProblems: z.number().int().nonnegative(),
  codingSolved: z.number().int().nonnegative(),
  codingMinDigital: z.number().int().nonnegative(),
  codingMinPrime: z.number().int().nonnegative(),
  passedDigital: z.boolean(),
  passedPrime: z.boolean(),
  problems: z.array(CodingProblemSummarySchema),
});

export type CodingBreakdownDto = z.infer<typeof CodingBreakdownDtoSchema>;

export const HiringEvaluationResultDtoSchema = z.object({
  strategy: z.string(),
  strategyVersion: z.number().int().default(1),
  qualification: z.enum(["NOT_QUALIFIED", "NINJA", "DIGITAL", "PRIME"]),
  qualificationReason: z.string(),
  foundationScore: z.number().int().nonnegative(),
  advancedScore: z.number().int().nonnegative(),
  codingSolved: z.number().int().nonnegative(),
  foundationBreakdown: FoundationBreakdownDtoSchema,
  advancedBreakdown: AdvancedBreakdownDtoSchema,
  codingBreakdown: CodingBreakdownDtoSchema,
  evaluatedAt: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date()),
});

export type HiringEvaluationResultDto = z.infer<typeof HiringEvaluationResultDtoSchema>;


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
