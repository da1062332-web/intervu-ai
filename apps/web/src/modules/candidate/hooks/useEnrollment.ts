import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';
import { useRouter } from 'next/navigation';

export const useEnrollment = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (testId: string) => dashboardService.enroll(testId),
    onSuccess: (data, testId) => {
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['candidate-dashboard-modular'] });
      queryClient.invalidateQueries({ queryKey: ['candidate-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['public-tests'] });
      
      router.push(`/candidate/tests/${testId}/instructions`);
    },
  });
};
