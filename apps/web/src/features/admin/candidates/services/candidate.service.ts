import { apiClient } from '@/services/api/client';
import type {
  CandidateListParams,
  CandidateListResponse,
  CandidateDetails,
  CandidateStats,
  CandidateTestHistoryParams,
  CandidateTestHistoryResponse,
} from '../types/candidate.types';

const ADMIN_CANDIDATES_PATH = '/admin/candidates';

export const adminCandidateService = {
  getCandidates(params: CandidateListParams = {}): Promise<CandidateListResponse> {
    return apiClient.request<CandidateListResponse>(ADMIN_CANDIDATES_PATH, {
      method: 'GET',
      query: params as any,
    });
  },

  getCandidateDetails(id: string): Promise<CandidateDetails> {
    return apiClient.request<CandidateDetails>(`${ADMIN_CANDIDATES_PATH}/${id}`, {
      method: 'GET',
    });
  },

  getCandidateStats(id: string): Promise<CandidateStats> {
    return apiClient.request<CandidateStats>(`${ADMIN_CANDIDATES_PATH}/${id}/stats`, {
      method: 'GET',
    });
  },

  getCandidateTests(
    id: string,
    params: CandidateTestHistoryParams = {},
  ): Promise<CandidateTestHistoryResponse> {
    return apiClient.request<CandidateTestHistoryResponse>(`${ADMIN_CANDIDATES_PATH}/${id}/tests`, {
      method: 'GET',
      query: params as any,
    });
  },
};
