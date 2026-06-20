import { apiClient } from '@/services/api/client';
import type { Topic, CreateTopicPayload, UpdateTopicPayload } from './types';

export const topicsApi = {
  getTopics: async (activeOnly = true) => {
    return apiClient.request<Topic[]>(`/admin/topics?activeOnly=${activeOnly}`, {
      method: 'GET',
    });
  },

  getTopic: async (id: string) => {
    return apiClient.request<Topic>(`/admin/topics/${id}`, {
      method: 'GET',
    });
  },

  createTopic: async (payload: CreateTopicPayload) => {
    return apiClient.request<Topic>('/admin/topics', {
      method: 'POST',
      body: payload,
    });
  },

  updateTopic: async (id: string, payload: UpdateTopicPayload) => {
    return apiClient.request<Topic>(`/admin/topics/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  deactivateTopic: async (id: string) => {
    return apiClient.request<Topic>(`/admin/topics/${id}`, {
      method: 'DELETE',
    });
  },
};
