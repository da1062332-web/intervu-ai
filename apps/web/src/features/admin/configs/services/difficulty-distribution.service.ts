import { apiClient } from '@/services/api/client';
import type {
  DifficultyDistributionResponse,
  UpdateDifficultyDistributionDto,
} from '@intervu/shared';

const BASE_PATH = '/admin/configs';

export const difficultyDistributionService = {
  getDifficultyDistribution: async (configId: string): Promise<DifficultyDistributionResponse> => {
    return apiClient
      .request<DifficultyDistributionResponse>(`${BASE_PATH}/${configId}/difficulty`, {
        method: 'GET',
        skipErrorToast: true,
      })
      .catch(() => ({
        id: '',
        examConfigId: configId,
        easyPercentage: 0,
        mediumPercentage: 0,
        hardPercentage: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
  },

  updateDifficultyDistribution: async (
    configId: string,
    payload: UpdateDifficultyDistributionDto,
  ): Promise<DifficultyDistributionResponse> => {
    return apiClient.request<DifficultyDistributionResponse>(
      `${BASE_PATH}/${configId}/difficulty`,
      {
        method: 'PUT',
        body: payload,
      },
    );
  },
};
