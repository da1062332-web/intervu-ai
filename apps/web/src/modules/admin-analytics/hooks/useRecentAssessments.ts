import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';
import { examConfigsApi } from '@/services/exam-configs/api';
import { toast } from 'sonner';

export function useRecentAssessments() {
  return useQuery({
    queryKey: ['admin-dashboard', 'recent-assessments'],
    queryFn: dashboardService.getRecentAssessments,
  });
}

export function useActivateAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return examConfigsApi.updateConfig(id, { isActive: true, status: 'PUBLISHED' });
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard', 'recent-assessments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      queryClient.invalidateQueries({ queryKey: ['configs', id] });
      toast.success('Assessment activated successfully');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Failed to activate assessment';
      toast.error(msg);
    },
  });
}

export function useDeactivateAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return examConfigsApi.updateConfig(id, { isActive: false, status: 'ARCHIVED' });
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard', 'recent-assessments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      queryClient.invalidateQueries({ queryKey: ['configs', id] });
      toast.success('Assessment deactivated successfully');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Failed to deactivate assessment';
      toast.error(msg);
    },
  });
}
