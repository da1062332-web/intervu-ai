import { useQuery } from '@tanstack/react-query';
import { testService } from '@/services/candidate/test.service';

export function useTestCatalog() {
  const query = useQuery({
    queryKey: ['candidate-catalog-modular'],
    queryFn: testService.getTestConfigs,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
