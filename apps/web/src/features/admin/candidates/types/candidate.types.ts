export interface CandidateListItem {
  id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
  assignedTests: number;
  attemptedTests: number;
  completedTests: number;
  averageScore: number;
  bestScore: number;
  qualification?: string;
  qualificationReason?: string;
  evaluationStrategy?: string;
  foundationScore?: number;
  advancedScore?: number;
  codingSolved?: number;
  lastAttempt: string;
  createdAt: string;
}

export interface CandidatePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CandidateListResponse {
  items: CandidateListItem[];
  pagination: CandidatePagination;
  summary?: {
    total: number;
    activeCount: number;
    inactiveCount: number;
  };
}

export interface CandidateListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  qualification?: string;
  strategy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CandidateDetails {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  status: 'ACTIVE' | 'INACTIVE' | string;
}

export interface CandidateStats {
  assignedTests: number;
  attemptedTests: number;
  completedTests: number;
  averageScore: number;
  bestScore: number;
  lastAttempt: string;
}

export interface CandidateTestHistoryItem {
  attemptId: string;
  assessmentName: string;
  status: string;
  score: number;
  percentage: number;
  qualification?: string;
  qualificationReason?: string;
  evaluationStrategy?: string;
  foundationScore?: number;
  advancedScore?: number;
  codingSolved?: number;
  startedAt: string;
  submittedAt: string;
}

export interface CandidateTestHistoryResponse {
  items: CandidateTestHistoryItem[];
  pagination?: CandidatePagination;
}

export interface CandidateTestHistoryParams {
  page?: number;
  limit?: number;
}
