export interface EvaluationResult {
  id: string;
  testId: string;
  candidateName: string;
  testName: string;
  overallScore: number;
  confidenceScore: number;
  totalQuestions: number;
  correctAnswers: number;
  submittedAt: string;
}

export interface SkillScore {
  id: string;
  name: string;
  score: number;
  feedback: string;
}

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Recommendation {
  id: string;
  priority: Priority;
  title: string;
  description: string;
}

export interface PerformanceSummary {
  testsCompleted: number;
  averageScore: number;
  bestScore: number;
  lastAssessmentDate: string;
}
