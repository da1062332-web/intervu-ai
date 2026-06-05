import { apiClient } from '@/services/api/client';
import type { DashboardStats, AnalyticsSummary, RecentActivity } from '@/types/dashboard.types';

const DASHBOARD_BASE_PATH = '/dashboard';

export const dashboardApi = {
  getStats(): Promise<DashboardStats> {
    return apiClient.request<DashboardStats>(`${DASHBOARD_BASE_PATH}/stats`, {
      method: 'GET',
    });
  },

  getAnalyticsSummary(): Promise<AnalyticsSummary> {
    return apiClient.request<AnalyticsSummary>(`${DASHBOARD_BASE_PATH}/analytics-summary`, {
      method: 'GET',
    });
  },

  getRecentActivity(): Promise<RecentActivity[]> {
    return apiClient.request<RecentActivity[]>(`${DASHBOARD_BASE_PATH}/recent-activity`, {
      method: 'GET',
    });
  },
};
