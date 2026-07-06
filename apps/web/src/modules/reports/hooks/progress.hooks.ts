import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';

export const useCandidateProgress = () => {
  return useQuery({
    queryKey: ['candidate-progress'],
    queryFn: async () => {
      return apiClient.request('/reports/progress');
    }
  });
};
