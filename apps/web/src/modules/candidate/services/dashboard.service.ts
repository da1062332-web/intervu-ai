import { apiClient } from '@/services/api/client';
import { CandidateDashboardData, CandidateRecommendations } from '../types/Dashboard';

export const dashboardService = {
  getDashboard: async (): Promise<CandidateDashboardData> => {
    try {
      const { configs } = await apiClient.request<{ configs: any[] }>('/tests/configs');
      const historyResponse = await apiClient.request<any>('/users/me/history');
      const performanceSummary = await apiClient.request<any>('/users/me/performance-summary');

      return {
        availableTests:
          configs?.map((config: any) => ({
            id: config.configId,
            title: config.name,
            durationMinutes: config.duration ? Math.floor(config.duration / 60) : 0,
            sections: config.sections || [],
            status: 'AVAILABLE',
          })) || [],

        activeTests: [],

        completedAttempts:
          historyResponse?.items?.map((item: any) => ({
            id: item.evaluationId,
            assessmentName: 'Assessment',
            score: item.overallScore || 0,
            completedDate: item.evaluatedAt || new Date().toISOString(),
            status: 'Completed',
          })) || [],

        recommendations: performanceSummary
          ? {
              overallScore: performanceSummary.averageScore || 0,
              confidenceScore: 0,
              recommendationSummary: `Based on your recent performance, your average score is ${performanceSummary.averageScore || 0}%.`,
            }
          : null,

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
};
