import { apiClient } from '@/services/api/client';
import { CandidateDashboardData } from '@/features/candidate/dashboard/types/candidateDashboard.types';

export const candidateDashboardService = {
  getCandidateDashboard: async (): Promise<CandidateDashboardData> => {
    try {
      // 1. Fetch available tests from real API
      const { configs } = await apiClient.request<{ configs: any[] }>('/tests/configs');

      // 2. Fetch history from real API
      const historyResponse = await apiClient.request<any>('/users/me/history');

      // 3. Fetch performance summary from real API
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

        activeTests: [], // No dedicated active test API currently exposed to candidate dashboard

        completedAttempts:
          historyResponse?.items?.map((item: any) => ({
            id: item.evaluationId,
            assessmentName: 'Assessment', // Fallback, could fetch from config or item if available
            score: item.overallScore || 0,
            completedDate: item.evaluatedAt || new Date().toISOString(),
            status: 'Completed',
          })) || [],

        recommendations: performanceSummary
          ? {
              overallScore: performanceSummary.averageScore || 0,
              confidenceScore: 0, // Backend might not provide this directly on summary
              recommendationSummary: `Based on your recent performance, your average score is ${performanceSummary.averageScore || 0}%. Focus on taking more practice tests to improve.`,
            }
          : null,

        skillProgress: [], // Requires a dedicated skill timeline API which might not be built yet
      };
    } catch (error) {
      console.error('Failed to fetch candidate dashboard', error);
      throw error;
    }
  },
};
