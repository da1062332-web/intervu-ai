import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

export const useEnrollments = () => {
  return useQuery({
    queryKey: ['candidate-enrollments'],
    queryFn: () => dashboardService.getEnrollments(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 30000,
  });
};
