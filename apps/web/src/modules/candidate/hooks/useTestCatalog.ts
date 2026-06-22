import { useQuery } from '@tanstack/react-query';
import { testCatalogService } from '../services/testCatalog.service';

export function useTestCatalog() {
  const query = useQuery({
    queryKey: ['candidate-catalog-modular'],
    queryFn: testCatalogService.getTests,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
