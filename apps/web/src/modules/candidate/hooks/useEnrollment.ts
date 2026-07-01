import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

export const useEnrollment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (testId: string) => dashboardService.enroll(testId),
    onSuccess: () => {
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['candidate-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['candidate-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['public-tests'] });
    },
  });
};
