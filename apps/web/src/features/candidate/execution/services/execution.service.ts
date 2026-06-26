import { TestInstance } from '../types/execution.types';
import { apiClient } from '@/services/api/client';

// The DTO format for POST /api/v1/tests/:id/answer
export interface CandidateAnswerPayload {
  questionId: string;
  answer: string;
  timeSpentSeconds?: number;
  isMarkedForReview?: boolean;
}

export const executionService = {
  getTestInstance: async (id: string): Promise<TestInstance> => {
    return apiClient.request<TestInstance>(`/tests/${id}`);
  },

  resumeAssessment: async (id: string): Promise<any> => {
    return apiClient.request<any>(`/tests/${id}/resume`);
  },

  saveAnswer: async (testId: string, payload: CandidateAnswerPayload): Promise<void> => {
    return apiClient.request(`/tests/${testId}/answer`, {
      method: 'POST',
      body: payload,
    });
  },

  submitAssessment: async (testId: string): Promise<void> => {
    return apiClient.request(`/tests/${testId}/submit`, {
      method: 'POST',
    });
  },
};
