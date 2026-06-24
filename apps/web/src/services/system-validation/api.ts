import { apiClient } from '@/services/api/client';
import type { SystemValidationResult } from '@/store/system-validation.store';

export const systemValidationApi = {
  validateConfig: async (configId: string): Promise<SystemValidationResult> => {
    return apiClient.request<SystemValidationResult>(`/system/validate-config/${configId}`, {
      method: 'POST',
    });
  },
};
