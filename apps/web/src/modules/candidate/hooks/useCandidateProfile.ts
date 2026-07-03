import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';
import { AuthUser } from '@/types/auth.types';

export const useCandidateProfile = () => {
  return useQuery({
    queryKey: ['candidate-profile'],
    queryFn: () => dashboardService.getProfile(),
    staleTime: 10 * 60 * 1000,
  });
};

export const useUpdateCandidateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<AuthUser>) => dashboardService.updateProfile(data),
    onSuccess: (data) => {
      // Update cache directly with new data
      queryClient.setQueryData(['candidate-profile'], data);
      // Also invalidate user query to update header/auth contexts if they share data
      queryClient.invalidateQueries({ queryKey: ['user', 'current'] });
    },
  });
};
