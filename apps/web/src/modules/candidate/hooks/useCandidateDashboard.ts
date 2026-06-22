import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { dashboardService } from '../services/dashboard.service';
import { useDashboardStore } from '../stores/dashboard.store';

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
