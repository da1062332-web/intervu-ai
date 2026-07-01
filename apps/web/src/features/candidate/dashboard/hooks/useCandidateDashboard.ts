import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { dashboardService } from '@/modules/candidate/services/dashboard.service';
import { useCandidateDashboardStore } from '../stores/candidateDashboard.store';

export function useCandidateDashboard() {
  const store = useCandidateDashboardStore();
  const setDashboard = useCandidateDashboardStore((state) => state.setDashboard);
  const setError = useCandidateDashboardStore((state) => state.setError);
  const setLoading = useCandidateDashboardStore((state) => state.setLoading);

  const query = useQuery({
    queryKey: ['candidate-dashboard'],
    queryFn: dashboardService.getDashboard,
  });

  useEffect(() => {
    if (query.data) {
      setDashboard(query.data as any);
    } else if (query.error) {
      setError(query.error instanceof Error ? query.error.message : 'Failed to load dashboard');
    } else if (query.isLoading) {
      setLoading(true);
    }
  }, [query.data, query.error, query.isLoading, setDashboard, setError, setLoading]);

  return {
    ...store,
    refetch: query.refetch,
  };
}
