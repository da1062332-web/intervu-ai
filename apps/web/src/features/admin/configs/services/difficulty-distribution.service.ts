import { apiClient } from '@/services/api/client';
import type {
  DifficultyDistributionResponse,
  UpdateDifficultyDistributionDto,
} from '@intervu/shared';

const BASE_PATH = '/admin/configs';

export const difficultyDistributionService = {
  getDifficultyDistribution: async (configId: string): Promise<DifficultyDistributionResponse> => {
    return apiClient.request<DifficultyDistributionResponse>(
      `${BASE_PATH}/${configId}/difficulty-distribution`,
      {
        method: 'GET',
      },
    );
  },

  updateDifficultyDistribution: async (
    configId: string,
    payload: UpdateDifficultyDistributionDto,
  ): Promise<DifficultyDistributionResponse> => {
    return apiClient.request<DifficultyDistributionResponse>(
      `${BASE_PATH}/${configId}/difficulty-distribution`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
    );
  },
};
