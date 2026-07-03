import { apiClient } from '@/services/api/client';
import { CandidateDashboardData, CandidateRecommendations } from '../types/Dashboard';
import { AuthUser } from '@/types/auth.types';

export const dashboardService = {
  getDashboard: async (): Promise<CandidateDashboardData> => {
    try {
      const data = await apiClient.request<any>('/candidate/dashboard');

      return {
        availableTests:
          data.upcomingTests?.map((t: any) => ({
            id: t.configId,
            title: t.name,
            durationMinutes: Math.floor((t.durationSeconds || 0) / 60),
            sections: t.sections || [],
            status: t.enrollmentStatus || 'AVAILABLE',
          })) || [],

        activeTests: data.activeAttempts || [],

        completedAttempts:
          data.completedTests?.map((t: any) => ({
            id: t.instanceId,
            assessmentName: t.name,
            score: t.score,
            completedDate: t.submittedAt || new Date().toISOString(),
            status: 'Completed',
          })) || [],

        recommendations: null,

        skillProgress: [],
      };
    } catch (error) {
      console.error('Failed to fetch dashboard', error);
      throw error;
    }
  },

  getRecommendations: async (): Promise<CandidateRecommendations | null> => {
    try {
      const performanceSummary = await apiClient.request<any>('/users/me/performance-summary');
      if (!performanceSummary) return null;

      return {
        overallScore: performanceSummary.averageScore || 0,
        confidenceScore: 0,
        recommendationSummary: `Based on your recent performance, your average score is ${performanceSummary.averageScore || 0}%.`,
      };
    } catch (error) {
      console.error('Failed to fetch recommendations', error);
      return null;
    }
  },

  getPublicTests: async (params?: Record<string, any>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, String(value));
      });
    }
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await apiClient.request<any>(`/candidate/tests${query}`);
    if (response && response.tests) {
      response.tests = response.tests.map((t: any) => ({
        id: t.configId,
        title: t.name,
        company: t.company,
        durationMinutes: t.duration ? Math.floor(t.duration / 60) : 0,
        sections: t.sections || [],
        difficulty: t.difficulty || 'Medium',
      }));
    }
    return response;
  },

  enroll: async (testId: string) => {
    return apiClient.request<any>('/candidate/enrollments', {
      method: 'POST',
      body: { testId },
    });
  },

  getEnrollments: async () => {
    return apiClient.request<any>('/candidate/enrollments');
  },

  getAttemptHistory: async (page = 1, limit = 10) => {
    return apiClient.request<any>(`/candidate/attempts?page=${page}&limit=${limit}`);
  },

  getProfile: async (): Promise<AuthUser> => {
    return apiClient.request<AuthUser>('/candidate/profile');
  },

  updateProfile: async (data: Partial<AuthUser>): Promise<AuthUser> => {
    return apiClient.request<AuthUser>('/candidate/profile', {
      method: 'PUT',
      body: data,
    });
  },
};
