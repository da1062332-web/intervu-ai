import { z } from "zod";

export const SkillScoreSchema = z.object({
  id: z.string().cuid(),
  skill: z.string(),
  score: z.number().min(0).max(100),
  feedback: z.string(),
});

export const ResultResponseSchema = z.object({
  id: z.string().cuid(),
  testId: z.string().nullable().optional(),
  testInstanceId: z.string().nullable().optional(),
  userId: z.string(),
  communicationScore: z.number(),
  technicalScore: z.number(),
  confidenceScore: z.number(),
  overallScore: z.number(),
  overallRating: z.number(),
  notes: z.string().nullable().optional(),
  totalQuestions: z.number(),
  correctAnswers: z.number(),
  incorrectAnswers: z.number(),
  evaluatedAt: z.union([z.date(), z.string()]),
  skillScores: z.array(SkillScoreSchema),
});

export const RecommendationResponseSchema = z.object({
  id: z.string().cuid(),
  evaluationId: z.string().cuid(),
  skill: z.string(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  title: z.string(),
  description: z.string(),
  createdAt: z.union([z.date(), z.string()]),
});

export const PerformanceSummaryResponseSchema = z.object({
  testsCompleted: z.number(),
  averageScore: z.number(),
  bestScore: z.number(),
  lastAssessmentDate: z.union([z.date(), z.string()]).nullable(),
});

export const HistoryItemResponseSchema = z.object({
  evaluationId: z.string().cuid(),
  testId: z.string().nullable().optional(),
  testInstanceId: z.string().nullable().optional(),
  overallScore: z.number(),
  evaluatedAt: z.union([z.date(), z.string()]),
});

export const HistoryResponseSchema = z.object({
  items: z.array(HistoryItemResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrevious: z.boolean(),
});
