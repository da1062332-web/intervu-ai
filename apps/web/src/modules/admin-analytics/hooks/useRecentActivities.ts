import { useQuery } from '@tanstack/react-query';
import { dashboardService, ActivitiesQueryParams } from '../services/dashboard.service';

export function useRecentActivities(params?: ActivitiesQueryParams) {
  return useQuery({
    queryKey: ['admin-dashboard', 'recent-activities', params],
    queryFn: () => dashboardService.getRecentActivities(params),
  });
}
