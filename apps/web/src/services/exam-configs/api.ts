import { apiClient } from '@/services/api/client';
import type {
  ExamConfig,
  CreateConfigPayload,
  UpdateConfigPayload,
  ConfigValidationResult,
  ConfigPreviewResponse,
  ConfigVersionEntry,
  PublishResult,
} from './types';

export const examConfigsApi = {
  // ─── CRUD ──────────────────────────────────────────────────────────────────

  getConfigs: () => {
    return apiClient.request<ExamConfig[]>('/admin/configs');
  },

  getConfig: (configId: string) => {
    return apiClient.request<ExamConfig>(`/admin/configs/${configId}`);
  },

  createConfig: (payload: CreateConfigPayload) => {
    return apiClient.request<ExamConfig>('/admin/configs', {
      method: 'POST',
      body: payload,
    });
  },

  updateConfig: (configId: string, payload: UpdateConfigPayload) => {
    return apiClient.request<ExamConfig>(`/admin/configs/${configId}`, {
      method: 'PATCH',
      body: payload,
    });
  },

  archiveConfig: (configId: string) => {
    return apiClient.request<ExamConfig>(`/admin/configs/${configId}`, {
      method: 'DELETE',
    });
  },

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * Run multi-layer validation on the configuration.
   * Marks the config as VALIDATED if all checks pass.
   */
  validateConfig: (configId: string) => {
    return apiClient.request<ConfigValidationResult>(`/admin/configs/${configId}/validate`, {
      method: 'POST',
    });
  },

  /**
   * Publish a validated configuration.
   * Full flow: Validate → Snapshot → Version → PUBLISHED status.
   */
  publishConfig: (configId: string) => {
    return apiClient.request<PublishResult>(`/admin/configs/${configId}/publish`, {
      method: 'POST',
    });
  },

  /**
   * Get downstream impact preview without mutating state.
   */
  previewConfig: (configId: string) => {
    return apiClient.request<ConfigPreviewResponse>(`/admin/configs/${configId}/preview`);
  },

  // ─── Versioning ────────────────────────────────────────────────────────────

  /**
   * Manually create a version snapshot of the current config state.
   */
  createVersion: (configId: string) => {
    return apiClient.request<ConfigVersionEntry>(`/admin/configs/${configId}/version`, {
      method: 'POST',
    });
  },

  /**
   * List all version history entries for a config (descending order).
   */
  getVersions: (configId: string) => {
    return apiClient.request<ConfigVersionEntry[]>(`/admin/configs/${configId}/versions`);
  },

  /**
   * Restore a configuration to a previous version.
   * This resets the config status to DRAFT.
   */
  restoreVersion: (configId: string, versionId: string) => {
    return apiClient.request<{ message: string; versionNumber: number }>(
      `/admin/configs/${configId}/restore/${versionId}`,
      { method: 'POST' },
    );
  },
};
