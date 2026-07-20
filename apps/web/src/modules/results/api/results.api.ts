import { apiClient } from '@/services/api/client';
import type {
  ResultDetails,
  PaginatedResults,
  DashboardWidgets,
  RecommendationResponse,
  StrengthWeaknessResponse,
  PerformanceDashboardResponse,
} from '../types/results.types';
import type { PerformanceAnalyticsDto } from '@intervu-ai/contracts';

const BASE_PATH = '/results';

export const resultApi = {
  getDashboardWidgets: async (): Promise<DashboardWidgets> => {
    return apiClient.request<DashboardWidgets>(`${BASE_PATH}/dashboard`);
  },

  getLatestResult: async (): Promise<any> => {
    return apiClient.request<any>(`${BASE_PATH}/latest`);
  },

  listCandidateResults: async (
    candidateId: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResults> => {
    return apiClient.request<PaginatedResults>(`${BASE_PATH}/candidate/${candidateId}`, {
      query: { page, limit },
    });
  },

  getResultDetails: async (attemptId: string): Promise<ResultDetails> => {
    return apiClient.request<ResultDetails>(`${BASE_PATH}/${attemptId}`);
  },

  getStatus: async (attemptId: string): Promise<{ status: string }> => {
    return apiClient.request<{ status: string }>(`${BASE_PATH}/status/${attemptId}`);
  },

  getAnalytics: async (attemptId: string): Promise<PerformanceAnalyticsDto> => {
    return apiClient.request<PerformanceAnalyticsDto>(`${BASE_PATH}/${attemptId}/analytics`);
  },

  getAnalysis: async (attemptId: string): Promise<StrengthWeaknessResponse> => {
    return apiClient.request<StrengthWeaknessResponse>(`${BASE_PATH}/${attemptId}/analysis`);
  },

  getRecommendations: async (attemptId: string): Promise<RecommendationResponse> => {
    return apiClient.request<RecommendationResponse>(`${BASE_PATH}/${attemptId}/recommendations`);
  },

  getPerformanceDashboard: async (attemptId: string): Promise<PerformanceDashboardResponse> => {
    return apiClient.request<PerformanceDashboardResponse>(`${BASE_PATH}/${attemptId}/performance-dashboard`);
  },

  exportToPdf: async (attemptId: string): Promise<Blob> => {
    return apiClient.request<Blob>(`/reports/export/pdf/${attemptId}`, {
      responseType: 'blob',
    });
  },

  exportToJson: async (attemptId: string): Promise<any> => {
    return apiClient.request<any>(`${BASE_PATH}/${attemptId}/export/json`);
  },
};
