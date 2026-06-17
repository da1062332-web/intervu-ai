import { apiClient } from '@/services/api/client';
import type { UpdateRuleFlags, RuleFlagsResponseDto } from '@intervu/shared';

export const ruleFlagsService = {
  getRuleFlags: async (configId: string): Promise<RuleFlagsResponseDto> => {
    return apiClient.request<RuleFlagsResponseDto>(`/admin/configs/${configId}/rule-flags`, {
      method: 'GET',
    });
  },

  updateRuleFlags: async (
    configId: string,
    payload: UpdateRuleFlags,
  ): Promise<RuleFlagsResponseDto> => {
    return apiClient.request<RuleFlagsResponseDto>(`/admin/configs/${configId}/rule-flags`, {
      method: 'PUT',
      body: payload,
    });
  },
};
