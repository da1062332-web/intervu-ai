import { apiClient } from '@/services/api/client';

export interface TopicWeightage {
  id: string;
  sectionId: string;
  topicId: string;
  weightagePercentage: number;
}

export const topicWeightagesApi = {
  getWeightages: async (sectionId: string) => {
    return apiClient.request<TopicWeightage[]>(`/admin/sections/${sectionId}/weightages`, {
      method: 'GET',
    });
  },

  createWeightage: async (sectionId: string, topicId: string, weightagePercentage: number) => {
    return apiClient.request<TopicWeightage>(`/admin/sections/${sectionId}/weightages`, {
      method: 'POST',
      body: { topicId, weightagePercentage },
    });
  },

  updateWeightage: async (id: string, weightagePercentage: number) => {
    return apiClient.request<TopicWeightage>(`/admin/weightages/${id}`, {
      method: 'PATCH',
      body: { weightagePercentage },
    });
  },

  deleteWeightage: async (id: string) => {
    return apiClient.request<void>(`/admin/weightages/${id}`, {
      method: 'DELETE',
    });
  },
};
