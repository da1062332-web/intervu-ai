import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

export function useCandidateDashboard() {
  const query = useQuery({
    queryKey: ['candidate-dashboard-modular'],
    queryFn: dashboardService.getDashboard,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}

export function useCandidateDashboardMetrics() {
  const query = useQuery({
    queryKey: ['candidate-dashboard-metrics'],
    queryFn: dashboardService.getDashboardMetrics,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
