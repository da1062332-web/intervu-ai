import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

export const useAttemptHistory = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['candidate-attempts', page, limit],
    queryFn: () => dashboardService.getAttemptHistory(page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
