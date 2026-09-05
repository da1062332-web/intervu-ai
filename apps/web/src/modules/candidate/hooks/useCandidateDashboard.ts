import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

export function useCandidateDashboard(candidateId?: string) {
  const query = useQuery({
    queryKey: ['candidate-dashboard-modular', candidateId],
    queryFn: dashboardService.getDashboard,
    enabled: !!candidateId,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}

export function useCandidateDashboardMetrics(candidateId?: string) {
  const query = useQuery({
    queryKey: ['candidate-dashboard-metrics', candidateId],
    queryFn: dashboardService.getDashboardMetrics,
    enabled: !!candidateId,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
