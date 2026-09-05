import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

export function useAssessmentCompletion() {
  return useQuery({
    queryKey: ['admin-dashboard', 'assessment-completion-rate'],
    queryFn: dashboardService.getAssessmentCompletionRate,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
