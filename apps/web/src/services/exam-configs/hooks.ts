import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examConfigsApi } from './api';
import type { CreateConfigPayload, UpdateConfigPayload } from './types';
import { toast } from 'sonner';

export const useConfigs = () => {
  return useQuery({
    queryKey: ['configs'],
    queryFn: () => examConfigsApi.getConfigs(),
  });
};

export const useConfig = (configId: string) => {
  return useQuery({
    queryKey: ['configs', configId],
    queryFn: () => examConfigsApi.getConfig(configId),
    enabled: !!configId,
  });
};

export const useCreateConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateConfigPayload) => examConfigsApi.createConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      toast.success('Exam configuration created successfully');
    },
    onError: () => {
      toast.error('Failed to create exam configuration');
    },
  });
};

export const useUpdateConfig = (configId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateConfigPayload) => examConfigsApi.updateConfig(configId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      queryClient.invalidateQueries({ queryKey: ['configs', configId] });
      toast.success('Exam configuration updated successfully');
    },
    onError: () => {
      toast.error('Failed to update exam configuration');
    },
  });
};
