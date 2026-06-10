import { CandidateDashboardData } from '@/features/candidate/dashboard/types/candidateDashboard.types';
import { mockCandidateDashboardData } from '@/features/candidate/dashboard/mocks/candidateDashboard.mock';

/**
 * Service to fetch candidate dashboard data.
 * Currently uses mock data. Should be replaced with actual API call.
 */
export const candidateDashboardService = {
  getCandidateDashboard: async (): Promise<CandidateDashboardData> => {
    // Simulate API delay
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockCandidateDashboardData);
      }, 1000);
    });
  },
};
