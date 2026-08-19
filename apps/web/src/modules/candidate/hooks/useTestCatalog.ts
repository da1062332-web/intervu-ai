import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

export function useTestCatalog(params?: Record<string, any>) {
  const query = useQuery({
    queryKey: ['public-tests', params],
    queryFn: () => dashboardService.getPublicTests(params),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  return {
    data: query.data?.tests || [],
    pagination: query.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
