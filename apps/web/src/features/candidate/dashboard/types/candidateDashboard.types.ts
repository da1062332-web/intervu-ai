export interface AvailableTest {
  id: string;
  title: string;
  durationMinutes: number;
  sections: string[];
  status: 'AVAILABLE' | 'EXPIRING_SOON';
}

export interface ActiveTest {
  id: string;
  title: string;
  remainingMinutes: number;
  status: 'IN_PROGRESS';
}

export interface AttemptHistory {
  id: string;
  assessmentName: string;
  score: number;
  completedDate: string; // ISO string
  status: 'Completed';
}

export interface SkillProgress {
  skill: string;
  score: number; // 0-100
}

export interface CandidateRecommendations {
  overallScore: number;
  confidenceScore: number;
  recommendationSummary: string;
}

export interface CandidateDashboardData {
  availableTests: AvailableTest[];
  activeTests: ActiveTest[];
  completedAttempts: AttemptHistory[];
  recommendations: CandidateRecommendations | null;
  skillProgress: SkillProgress[];
}
