import { CandidateResultDto, PerformanceAnalyticsDto } from '@SkillitriX-ai/contracts';

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
  qualification?: string;
  qualificationReason?: string;
  evaluationStrategy?: string;
  foundationScore?: number;
  advancedScore?: number;
  codingSolved?: number;
  qualificationDetails?: any;
  candidate?: {
    fullName: string;
    email: string;
  };
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

export type PerformanceDashboardResponse = {
  overallScore: number;
  percentage: number;
  overallAccuracy: number;
  grade: string;
  timeEfficiency: number;
  totalTimeSpent: number;
  strengths: string[];
  weaknesses: string[];
  accuracyDetails: {
    correct: number;
    wrong: number;
    skipped: number;
  };
  sectionAccuracy: {
    questionCount: number;
    sectionName: string;
    correct: number;
    wrong: number;
    skipped: number;
    accuracy: number;
    topics?: {
      topicName: string;
      sectionName?: string;
      accuracy: number;
      correct: number;
      total: number;
    }[];
  }[];
  topicAccuracy?: {
    topicName: string;
    sectionName?: string;
    accuracy: number;
    correct: number;
    total: number;
  }[];
  sectionTime: {
    sectionName: string;
    spentTime: number;
    expectedTime: number;
    timeDifference: number;
    status: string;
    accuracy?: number;
    questionCount?: number;
    avgTimePerQuestion?: string;
    timeUsedPercentage?: number;
    pacingFeedback?: string;
  }[];
  detailedStrengthsWeaknesses?: {
    name: string;
    score: number;
    category: 'STRENGTH' | 'NEEDS_IMPROVEMENT' | 'WEAKNESS';
    feedback: string;
  }[];
  recommendations: string[];
  // Enriched fields
  maxMarks?: number;
  objectiveScore?: number;
  codingScore?: number;
  objectiveMaxMarks?: number;
  codingMaxMarks?: number;
  passed?: boolean;
  rank?: number;
  totalCandidates?: number;
  percentile?: number;
  qualification?: string;
  qualificationReason?: string;
};
