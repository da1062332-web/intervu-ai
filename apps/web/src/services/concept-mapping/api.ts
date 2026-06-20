import { apiClient } from '@/services/api/client';
import type { ConceptMapping, CreateConceptPayload, UpdateConceptPayload } from './types';

export const conceptMappingApi = {
  getConcepts: async (topicId: string, activeOnly = true) => {
    return apiClient.request<ConceptMapping[]>(
      `/admin/topics/${topicId}/concepts?activeOnly=${activeOnly}`,
      {
        method: 'GET',
      },
    );
  },

  createConcept: async (topicId: string, payload: CreateConceptPayload) => {
    return apiClient.request<ConceptMapping>(`/admin/topics/${topicId}/concepts`, {
      method: 'POST',
      body: payload,
    });
  },

  updateConcept: async (conceptId: string, payload: UpdateConceptPayload) => {
    return apiClient.request<ConceptMapping>(`/admin/concepts/${conceptId}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  deactivateConcept: async (conceptId: string) => {
    return apiClient.request<void>(`/admin/concepts/${conceptId}`, {
      method: 'DELETE',
    });
  },
};
