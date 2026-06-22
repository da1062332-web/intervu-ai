import { useQuery } from '@tanstack/react-query';
import { testCatalogService } from '../services/testCatalog.service';

export function useTestDetails(id: string) {
  const query = useQuery({
    queryKey: ['candidate-test-details-modular', id],
    queryFn: () => testCatalogService.getTestById(id),
    enabled: !!id,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
