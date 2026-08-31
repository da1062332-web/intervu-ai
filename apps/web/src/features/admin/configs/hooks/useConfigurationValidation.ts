import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examConfigsApi } from '@/services/exam-configs/api';
import { ConfigReadinessResponse } from '@/services/exam-configs/types';

export function useConfigurationValidation(configId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['config-readiness', configId],
    queryFn: async (): Promise<ConfigReadinessResponse | null> => {
      if (!configId) return null;
      try {
        const response = await examConfigsApi.getReadiness(configId);
        // The API wraps it in { success, data, error }, so return data
        return (response as any).data || response;
      } catch (error) {
        console.error('Failed to fetch readiness:', error);
        return null;
      }
    },
    enabled: !!configId,
    staleTime: 30000,
    refetchInterval: 60000, // Poll every 60s instead of 5s to prevent query storms
    refetchOnWindowFocus: false,
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      if (!configId) return null;
      const response = await examConfigsApi.refreshReadiness(configId);
      return (response as any).data || response;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(['config-readiness', configId], data);
      }
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refresh: refreshMutation.mutate,
    isRefreshing: refreshMutation.isPending,
  };
}
