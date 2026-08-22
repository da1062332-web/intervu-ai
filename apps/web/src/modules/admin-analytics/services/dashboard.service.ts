import { apiClient } from '@/services/api/client';

export interface AssessmentCompletionRate {
  completionRate: number;
  completed: number;
  pending: number;
}

export interface RecentAssessment {
  id: string;
  assessmentName: string;
  status: string;
  candidateCount: number;
  createdAt: string;
}

export interface RecentTestAttempt {
  id?: string;
  attemptId?: string;
  email?: string;
  candidateName: string;
  assessment: string;
  score: number;
  status: string;
  submittedAt: string;
}

export interface ActivityTimelineItem {
  activityType: string;
  title: string;
  description: string;
  performedBy: string;
  createdAt: string;
}

export interface ActivitiesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  user?: string;
  startDate?: string;
  endDate?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ActivitiesPaginatedResponse {
  data: ActivityTimelineItem[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export const dashboardService = {
  getTotalAssessments: () =>
    apiClient
      .request<{ totalAssessments: number }>('/admin/dashboard/total-assessments')
      .then((res) => res.totalAssessments),

  getActiveAssessments: () =>
    apiClient
      .request<{ activeAssessments: number }>('/admin/dashboard/active-assessments')
      .then((res) => res.activeAssessments),

  getTotalCandidates: () =>
    apiClient
      .request<{ totalCandidates: number }>('/admin/dashboard/total-candidates')
      .then((res) => res.totalCandidates),

  getCompletedTests: () =>
    apiClient
      .request<{ completedTests: number }>('/admin/dashboard/completed-tests')
      .then((res) => res.completedTests),

  getAverageScore: () =>
    apiClient
      .request<{ averageScore: number }>('/admin/dashboard/average-score')
      .then((res) => res.averageScore),

  getQuestionBankCount: () =>
    apiClient
      .request<{ questionBankCount: number }>('/admin/dashboard/question-bank-count')
      .then((res) => res.questionBankCount),

  getAssessmentCompletionRate: () =>
    apiClient.request<AssessmentCompletionRate>('/admin/dashboard/assessment-completion-rate'),

  getRecentAssessments: (params?: { limit?: number; page?: number }) => {
    const limit = params?.limit ?? 5;
    return apiClient
      .request<{ data: RecentAssessment[] }>(`/admin/dashboard/recent-assessments?limit=${limit}`)
      .then((res) => res.data);
  },

  getRecentTestAttempts: () =>
    apiClient
      .request<{ data: RecentTestAttempt[] }>('/admin/dashboard/recent-test-attempts')
      .then((res) => res.data),

  getRecentActivities: (params?: ActivitiesQueryParams) => {
    const query = new URLSearchParams();
    if (params?.page !== undefined) query.append('page', params.page.toString());
    if (params?.limit !== undefined) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.type && params.type !== 'all') query.append('type', params.type);
    if (params?.user) query.append('user', params.user);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.sortOrder) query.append('sortOrder', params.sortOrder);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient.request<ActivitiesPaginatedResponse>(
      `/admin/dashboard/recent-activities${queryString}`,
    );
  },
};
