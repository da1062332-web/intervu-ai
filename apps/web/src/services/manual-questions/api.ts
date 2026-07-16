import { apiClient } from '@/services/api/client';
import { ManualQuestion, ManualQuestionFilters } from './types';

export const manualQuestionsApi = {
  getQuestions: async (filters?: ManualQuestionFilters) => {
    return apiClient.request<{ items: ManualQuestion[]; total: number }>('/manual-questions', {
      method: 'GET',
      query: filters as any,
    });
  },

  searchQuestions: async (query?: any) => {
    return apiClient.request<{ items: ManualQuestion[]; total: number }>('/manual-questions/search', {
      method: 'GET',
      query,
    });
  },

  getQuestionById: async (id: string) => {
    return apiClient.request<ManualQuestion>(`/manual-questions/${id}`, {
      method: 'GET',
    });
  },

  createQuestion: async (payload: Partial<ManualQuestion>) => {
    return apiClient.request<ManualQuestion>('/manual-questions', {
      method: 'POST',
      body: payload,
    });
  },

  updateQuestion: async (id: string, payload: Partial<ManualQuestion>) => {
    return apiClient.request<ManualQuestion>(`/manual-questions/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  deleteQuestion: async (id: string) => {
    return apiClient.request<void>(`/manual-questions/${id}`, {
      method: 'DELETE',
    });
  },
};
