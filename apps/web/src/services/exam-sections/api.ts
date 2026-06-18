import { apiClient } from '@/services/api/client';
import type { ExamSection, CreateSectionPayload, UpdateSectionPayload } from './types';

export const examSectionsApi = {
  getSections: async (configId: string) => {
    const url = `/admin/configs/${configId}/sections`;
    console.log(`[DEBUG] Section API - Fetching configId: ${configId}`);
    try {
      const response = await apiClient.request<any[]>(url, { method: 'GET' });
      console.log(`[DEBUG] Section API - Response Status: SUCCESS`);
      // Map backend fields to frontend expectations
      return response.map((s) => ({
        ...s,
        durationMinutes: s.sectionDurationMinutes || s.durationMinutes,
        displayOrder: s.sectionOrder || s.displayOrder,
      })) as unknown as ExamSection[];
    } catch (error: unknown) {
      console.log(`[DEBUG] Section API - Response Status: ERROR`);
      throw error;
    }
  },

  createSection: (configId: string, payload: CreateSectionPayload) => {
    return apiClient.request<ExamSection>(`/admin/configs/${configId}/sections`, {
      method: 'POST',
      body: {
        ...payload,
        code: payload.name.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
        sectionDurationMinutes: payload.durationMinutes,
        sectionOrder: payload.displayOrder,
        isRequired: true,
      },
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
