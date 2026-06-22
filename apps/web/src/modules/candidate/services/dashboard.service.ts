import { CandidateDashboardData, CandidateRecommendations } from '../types/Dashboard';
import { mockCandidateDashboardData } from '../mocks/dashboard.mock';

export const dashboardService = {
  /**
   * GET /api/v1/dashboard
   */
  getDashboard: async (): Promise<CandidateDashboardData> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockCandidateDashboardData);
      }, 300);
    });
  },

  /**
   * GET /api/v1/recommendations
   */
  getRecommendations: async (): Promise<CandidateRecommendations | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockCandidateDashboardData.recommendations);
      }, 300);
    });
  },
};
