import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

export const useEnrollments = (candidateId?: string) => {
  return useQuery({
    queryKey: ['candidate-enrollments', candidateId],
    queryFn: () => dashboardService.getEnrollments(),
    enabled: !!candidateId,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 30000,
  });
};
