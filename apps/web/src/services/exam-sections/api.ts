import { apiClient } from '@/services/api/client';
import type { ExamSection, CreateSectionPayload, UpdateSectionPayload } from './types';

export const examSectionsApi = {
  getSections: async (configId: string) => {
    const url = `/admin/configs/${configId}/sections`;
    console.log(`[DEBUG] Section API - Fetching configId: ${configId}`);
    console.log(`[DEBUG] Section API - Request URL: ${url}`);
    try {
      const response = await apiClient.request<ExamSection[]>(url, {
        method: 'GET',
      });
      console.log(`[DEBUG] Section API - Response Status: SUCCESS`);
      return response;
    } catch (error: unknown) {
      const err = error as { status?: number };
      console.log(`[DEBUG] Section API - Response Status: ERROR ${err?.status || 'Unknown'}`);
      throw error;
    }
  },

  createSection: (configId: string, payload: CreateSectionPayload) => {
    return apiClient.request<ExamSection>(`/admin/configs/${configId}/sections`, {
      method: 'POST',
      body: payload,
    });
  },

  updateSection: (sectionId: string, payload: UpdateSectionPayload) => {
    return apiClient.request<ExamSection>(`/admin/sections/${sectionId}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  deleteSection: (sectionId: string) => {
    return apiClient.request<void>(`/admin/sections/${sectionId}`, {
      method: 'DELETE',
    });
  },
};
