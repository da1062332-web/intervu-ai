import { CandidateResultDto, PerformanceAnalyticsDto } from '@intervu-ai/contracts';

export type ResultDetails = {
  attemptId: string;
  assessmentName: string;
  score: number;
  percentage: number;
  accuracy: number;
  completion: number;
  status: string;
  submittedAt: Date | string;
  rank: number;
};

export type PaginatedResults = {
  data: (CandidateResultDto & { assessmentName: string })[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type DashboardWidgets = {
  latestResult: { score: number; attemptId: string } | null;
  bestScore: number | null;
  recentAttempt: Date | string | null;
  recommendedPractice: string | null;
  averageAccuracy: number | null;
  attemptCount: number;
  trend: number[];
};

export type RecommendationResponse = {
  practiceSuggestions: string[];
  focusTopics: string[];
  improvementPlan: string[];
  estimatedPracticeHours: number;
  priority: string;
};

export type StrengthWeaknessResponse = {
  strengths: { topic: string; score: number; remarks: string }[];
  weaknesses: { topic: string; score: number; remarks: string }[];
};
