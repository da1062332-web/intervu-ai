import { apiClient } from '@/services/api/client';
import type {
  BlueprintConfig,
  BlueprintDetail,
  CreateBlueprintPayload,
  UpdateBlueprintPayload,
  AddTopicConfigPayload,
  StyleProfile,
  ValidationSummary,
} from './types';

export const blueprintsApi = {
  // Legacy Style Profiles (keeping if needed elsewhere)
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

  // Blueprint Configs
  getBlueprints: () => {
    return apiClient.request<BlueprintConfig[]>('/blueprints');
  },

  getBlueprint: (id: string) => {
    return apiClient.request<BlueprintDetail>(`/blueprints/${id}`);
  },

  createBlueprint: (payload: CreateBlueprintPayload) => {
    return apiClient.request<BlueprintConfig>('/blueprints', {
      method: 'POST',
      body: payload,
    });
  },

  updateBlueprint: (id: string, payload: UpdateBlueprintPayload) => {
    return apiClient.request<BlueprintConfig>(`/blueprints/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  deleteBlueprint: (id: string) => {
    return apiClient.request<{ id: string }>(`/blueprints/${id}`, {
      method: 'DELETE',
    });
  },

  addTopicConfig: (id: string, payload: AddTopicConfigPayload) => {
    return apiClient.request<unknown>(`/blueprints/${id}/topics`, {
      method: 'POST',
      body: payload,
    });
  },

  validateBlueprint: (id: string) => {
    return apiClient.request<ValidationSummary>(`/blueprints/${id}/validate`, {
      method: 'POST',
    });
  },

  previewBlueprint: (id: string) => {
    return apiClient.request<any>(`/blueprints/${id}/preview`);
  },
};
