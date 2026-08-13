import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

export const useAttemptHistory = (candidateId?: string, page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['candidate-attempts', candidateId, page, limit],
    queryFn: () => dashboardService.getAttemptHistory(page, limit),
    enabled: !!candidateId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
