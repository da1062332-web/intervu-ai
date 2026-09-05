import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

export function useRecentTestAttempts() {
  return useQuery({
    queryKey: ['admin-dashboard', 'recent-test-attempts'],
    queryFn: dashboardService.getRecentTestAttempts,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
