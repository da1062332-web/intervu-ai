export interface DashboardStats {
  testsTaken: number;
  averageScore: number;
  completionRate: number;
  totalSessions: number;
}

export interface DashboardAnalyticsSummary {
  communicationScore: number;
  technicalScore: number;
  confidenceScore: number;
  overallRating: number;
}

export interface DashboardActivityItem {
  id: string;
  type: 'interview_completed';
  title: string;
  createdAt: string; // ISO 8601
}
