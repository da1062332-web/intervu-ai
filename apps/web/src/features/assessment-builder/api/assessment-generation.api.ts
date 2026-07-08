import { apiClient } from '@/services/api/client';
import type { GenerationRequest } from '@intervu-ai/contracts';
import type { Assessment, GeneratedQuestion } from '../types';

export const assessmentGenerationApi = {
  /**
   * Triggers the assessment generation process.
   * If the backend returns a job or completes synchronously, it's mapped here.
   */
  generateAssessment: async (payload: GenerationRequest): Promise<{ success: boolean; data: any; meta: any }> => {
    return apiClient.request('/test-assemblies/questions/generate', {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Fetches the status of a generation job.
   */
  getGenerationJob: async (jobId: string): Promise<{ id: string; status: string; progress: number; result: any; failedReason: string | null }> => {
    return apiClient.request(`/test-assemblies/jobs/${jobId}`, {
      method: 'GET',
    });
  },

  /**
   * Fetches a generated assessment by ID.
   */
  getAssessment: async (id: string): Promise<Assessment> => {
    return apiClient.request(`/test-assemblies/${id}`, {
      method: 'GET',
    });
  },

  /**
   * Fetches questions from the pool.
   */
  getQuestions: async (params?: any): Promise<{ data: GeneratedQuestion[]; meta: any }> => {
    return apiClient.request('/questions', {
      method: 'GET',
      query: params,
    });
  }
};
