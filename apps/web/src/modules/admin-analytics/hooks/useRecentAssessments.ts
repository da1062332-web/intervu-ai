import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

export function useRecentAssessments() {
  return useQuery({
    queryKey: ['admin-dashboard', 'recent-assessments'],
    queryFn: dashboardService.getRecentAssessments,
  });
}
