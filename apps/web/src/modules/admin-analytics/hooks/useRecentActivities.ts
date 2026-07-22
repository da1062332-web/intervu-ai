import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

export function useRecentActivities() {
  return useQuery({
    queryKey: ['admin-dashboard', 'recent-activities'],
    queryFn: dashboardService.getRecentActivities,
  });
}
