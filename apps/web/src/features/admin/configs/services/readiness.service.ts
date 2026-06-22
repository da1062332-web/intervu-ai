import { apiClient } from '@/services/api/client';
import type { ReadinessReport } from '@/store/readiness.store';

export const readinessService = {
  getReadiness: async (configId: string): Promise<ReadinessReport> => {
    return apiClient.request<ReadinessReport>(`/configs/${configId}/readiness`, {
      method: 'GET',
    });
  },

  generateReadiness: async (configId: string): Promise<ReadinessReport> => {
    return apiClient.request<ReadinessReport>(`/configs/${configId}/readiness`, {
      method: 'POST',
    });
  },
};
