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

export const dashboardService = {
  getTotalAssessments: () => 
    apiClient.request<{ totalAssessments: number }>('/admin/dashboard/total-assessments').then(res => res.totalAssessments),
  
  getActiveAssessments: () => 
    apiClient.request<{ activeAssessments: number }>('/admin/dashboard/active-assessments').then(res => res.activeAssessments),
  
  getTotalCandidates: () => 
    apiClient.request<{ totalCandidates: number }>('/admin/dashboard/total-candidates').then(res => res.totalCandidates),
  
  getCompletedTests: () => 
    apiClient.request<{ completedTests: number }>('/admin/dashboard/completed-tests').then(res => res.completedTests),
  
  getAverageScore: () => 
    apiClient.request<{ averageScore: number }>('/admin/dashboard/average-score').then(res => res.averageScore),
  
  getQuestionBankCount: () => 
    apiClient.request<{ questionBankCount: number }>('/admin/dashboard/question-bank-count').then(res => res.questionBankCount),
  
  getAssessmentCompletionRate: () => 
    apiClient.request<AssessmentCompletionRate>('/admin/dashboard/assessment-completion-rate'),
    
  getRecentAssessments: () => 
    apiClient.request<{ data: RecentAssessment[] }>('/admin/dashboard/recent-assessments').then(res => res.data),
    
  getRecentTestAttempts: () => 
    apiClient.request<{ data: RecentTestAttempt[] }>('/admin/dashboard/recent-test-attempts').then(res => res.data),
    
  getRecentActivities: () => 
    apiClient.request<{ data: ActivityTimelineItem[] }>('/admin/dashboard/recent-activities').then(res => res.data),
};
