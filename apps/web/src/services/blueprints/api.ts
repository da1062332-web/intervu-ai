import { apiClient } from '@/services/api/client';
import type {
  ExamBlueprint,
  StyleProfile,
  CreateBlueprintPayload,
  UpdateBlueprintPayload,
  ValidationResult,
  BlueprintPreviewData,
} from './types';

export const blueprintsApi = {
  // Style Profiles
  getStyleProfiles: () => {
    return apiClient.request<StyleProfile[]>('/style-profiles');
  },

  createStyleProfile: (payload: any) => {
    return apiClient.request<StyleProfile>('/style-profiles', {
      method: 'POST',
      body: payload,
    });
  },

  updateStyleProfile: (id: string, payload: any) => {
    return apiClient.request<StyleProfile>(`/style-profiles/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  // Blueprints
  getBlueprints: () => {
    return apiClient.request<ExamBlueprint[]>('/blueprints');
  },

  getBlueprint: (id: string) => {
    return apiClient.request<ExamBlueprint>(`/blueprints/${id}`);
  },

  createBlueprint: (payload: CreateBlueprintPayload) => {
    return apiClient.request<ExamBlueprint>('/blueprints', {
      method: 'POST',
      body: payload,
    });
  },

  updateBlueprint: (id: string, payload: UpdateBlueprintPayload) => {
    return apiClient.request<ExamBlueprint>(`/blueprints/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  validateBlueprint: (id: string) => {
    return apiClient.request<ValidationResult>(`/blueprints/${id}/validate`, {
      method: 'POST',
    });
  },

  previewBlueprint: (id: string) => {
    return apiClient.request<BlueprintPreviewData>(`/blueprints/${id}/preview`);
  },
};
