import { apiClient } from '@/services/api/client';
import type { ExamConfig, CreateConfigPayload, UpdateConfigPayload } from './types';

export const examConfigsApi = {
  getConfigs: () => {
    return apiClient.request<ExamConfig[]>('/admin/configs');
  },

  getConfig: (configId: string) => {
    return apiClient.request<ExamConfig>(`/admin/configs/${configId}`);
  },

  createConfig: (payload: CreateConfigPayload) => {
    return apiClient.request<ExamConfig>('/admin/configs', {
      method: 'POST',
      body: payload,
    });
  },

  updateConfig: (configId: string, payload: UpdateConfigPayload) => {
    return apiClient.request<ExamConfig>(`/admin/configs/${configId}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  archiveConfig: (configId: string) => {
    return apiClient.request<ExamConfig>(`/admin/configs/${configId}`, {
      method: 'DELETE',
    });
  },
};
