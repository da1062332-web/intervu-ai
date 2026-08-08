import { apiClient } from '@/services/api/client';
import type {
  QuestionGenerationRequest,
  ValidateQuestionRequest,
  GenerateQuestionResponse,
  QuestionPreviewResult,
  ValidateQuestionResponse,
} from './types';

/**
 * Question Generation API Service
 *
 * All three endpoints share the same request shape (QuestionGenerationRequest).
 * Only backend behavior differs — preview never persists, generate always persists.
 */
export const questionGenerationApi = {
  /**
   * POST /api/v1/question-generation/generate
   *
   * Full pipeline: Resolve → Context → Prompt → LLM → Validate → Assemble → Persist.
   * Always persists. Returns the saved Question + validationReport.
   */
  generate: async (payload: QuestionGenerationRequest): Promise<GenerateQuestionResponse> => {
    return apiClient.request<GenerateQuestionResponse>('/question-generation/generate', {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * POST /api/v1/question-generation/preview
   *
   * Preview-only: Resolve → Context → Prompt → LLM.
   * NEVER persists. Returns rendered preview text + context.
   */
  preview: async (payload: QuestionGenerationRequest): Promise<QuestionPreviewResult> => {
    return apiClient.request<QuestionPreviewResult>('/question-generation/preview', {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * POST /api/v1/question-generation/validate
   *
   * Validates a question (or generates one) against strategy-specific rules.
   * Returns a ValidationReport. Does not persist.
   */
  validate: async (payload: ValidateQuestionRequest): Promise<ValidateQuestionResponse> => {
    return apiClient.request<ValidateQuestionResponse>('/question-generation/validate', {
      method: 'POST',
      body: payload,
    });
  },

  batch: async (payload: {
    templateId: string;
    count: number;
    context?: any;
  }): Promise<{ jobId: string; status: string }> => {
    return apiClient.request<{ jobId: string; status: string }>('/question-generation/batch', {
      method: 'POST',
      body: payload,
    });
  },

  getJobs: async (templateId: string): Promise<any[]> => {
    return apiClient.request<any[]>(`/question-generation/jobs/${templateId}`, {
      method: 'GET',
    });
  },

  getAuditLogs: async (jobId: string): Promise<any[]> => {
    return apiClient.request<any[]>(`/question-generation/audit/${jobId}`, {
      method: 'GET',
    });
  },
};
