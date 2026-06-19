import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ruleFlagsService } from '../services/rule-flags.service';
import type { UpdateRuleFlags } from '@intervu/shared';
import { toast } from 'sonner';

export const useRuleFlags = (configId: string) => {
  return useQuery({
    queryKey: ['rules', configId],
    queryFn: () => ruleFlagsService.getRuleFlags(configId),
    enabled: !!configId,
  });
};

export const useSaveRules = (configId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateRuleFlags) => ruleFlagsService.updateRuleFlags(configId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      toast.success('Success', {
        description: 'Rule flags updated successfully',
      });
    },
    onError: (error: any) => {
      toast.error('Error', {
        description: error?.message || 'Failed to update rule flags',
      });
    },
  });
};
