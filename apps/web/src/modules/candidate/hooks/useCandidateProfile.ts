import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';
import { AuthUser } from '@/types/auth.types';

export const useCandidateProfile = (candidateId?: string) => {
  return useQuery({
    queryKey: ['candidate-profile', candidateId],
    queryFn: () => dashboardService.getProfile(),
    enabled: !!candidateId,
    staleTime: 10 * 60 * 1000,
  });
};

export const useUpdateCandidateProfile = (candidateId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<AuthUser>) => dashboardService.updateProfile(data),
    onSuccess: (data) => {
      // Update cache directly with new data
      queryClient.setQueryData(['candidate-profile', candidateId], data);
      // Also invalidate user query to update header/auth contexts if they share data
      queryClient.invalidateQueries({ queryKey: ['user', 'current'] });
    },
  });
};
