import { apiClient } from '@/services/api/client';
import type {
  BlueprintConfig,
  BlueprintDetail,
  CreateBlueprintPayload,
  UpdateBlueprintPayload,
  AddTopicConfigPayload,
  StyleProfile,
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
    return apiClient.request<BlueprintConfig[]>('/admin/blueprints');
  },

  getBlueprint: (id: string) => {
    return apiClient.request<BlueprintDetail>(`/admin/blueprints/${id}`);
  },

  createBlueprint: (payload: CreateBlueprintPayload) => {
    return apiClient.request<BlueprintConfig>('/admin/blueprints', {
      method: 'POST',
      body: payload,
    });
  },

  updateBlueprint: (id: string, payload: UpdateBlueprintPayload) => {
    return apiClient.request<BlueprintConfig>(`/admin/blueprints/${id}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  deleteBlueprint: (id: string) => {
    return apiClient.request<{ id: string }>(`/admin/blueprints/${id}`, {
      method: 'DELETE',
    });
  },

  addTopicConfig: (id: string, payload: AddTopicConfigPayload) => {
    return apiClient.request<unknown>(`/admin/blueprints/${id}/topics`, {
      method: 'POST',
      body: payload,
    });
  },
};
