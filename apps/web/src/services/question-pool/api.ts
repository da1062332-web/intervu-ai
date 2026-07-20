import { apiClient } from '@/services/api/client';
import { GeneratedQuestion, QuestionFilters } from './types';

export const questionPoolApi = {
  getGeneratedQuestions: async (filters?: QuestionFilters): Promise<GeneratedQuestion[]> => {
    const query: Record<string, string> = {};

    if (filters?.search) query.q = filters.search;
    if (filters?.templateId) query.templateId = filters.templateId;
    if (filters?.conceptId) query.conceptKey = filters.conceptId;
    if (filters?.difficulty) query.difficulty = filters.difficulty;
    if (filters?.status) query.status = filters.status;
    if (filters?.topicId) query.topicId = filters.topicId;

    return apiClient.request<GeneratedQuestion[]>('/questions', {
      method: 'GET',
      query,
    });
  },

  approveQuestion: async (id: string): Promise<GeneratedQuestion> => {
    return apiClient.request<GeneratedQuestion>(`/questions/${id}/approve`, {
      method: 'POST',
    });
  },

  rejectQuestion: async (id: string): Promise<GeneratedQuestion> => {
    return apiClient.request<GeneratedQuestion>(`/questions/${id}/reject`, {
      method: 'POST',
    });
  },

  publishQuestion: async (id: string): Promise<GeneratedQuestion> => {
    return apiClient.request<GeneratedQuestion>(`/questions/${id}/publish`, {
      method: 'POST',
    });
  },

  updateQuestion: async (id: string, payload: Partial<GeneratedQuestion>): Promise<GeneratedQuestion> => {
    return apiClient.request<GeneratedQuestion>(`/questions/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  regenerateQuestion: async (id: string): Promise<GeneratedQuestion> => {
    return apiClient.request<GeneratedQuestion>(`/questions/${id}/regenerate`, {
      method: 'POST',
    });
  },

  getQuestion: async (id: string): Promise<GeneratedQuestion> => {
    return apiClient.request<GeneratedQuestion>(`/questions/${id}`, {
      method: 'GET',
    });
  },
};
