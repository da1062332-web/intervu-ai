import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { topicsApi } from './api';
import type { CreateTopicPayload, UpdateTopicPayload } from './types';
import { toast } from 'sonner';

export const useTopics = (activeOnly = true) => {
  return useQuery({
    queryKey: ['topics', activeOnly],
    queryFn: () => topicsApi.getTopics(activeOnly),
  });
};

export const useTopic = (id: string) => {
  return useQuery({
    queryKey: ['topic', id],
    queryFn: () => topicsApi.getTopic(id),
    enabled: !!id,
  });
};

export const useCreateTopic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTopicPayload) => topicsApi.createTopic(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      toast.success('Topic created successfully');
    },
    onError: () => {
      toast.error('Failed to create topic');
    },
  });
};

export const useUpdateTopic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTopicPayload }) =>
      topicsApi.updateTopic(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['topic', id] });
      toast.success('Topic updated successfully');
    },
    onError: () => {
      toast.error('Failed to update topic');
    },
  });
};

export const useDeactivateTopic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => topicsApi.deactivateTopic(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['topic', id] });
      toast.success('Topic deactivated successfully');
    },
    onError: () => {
      toast.error('Failed to deactivate topic');
    },
  });
};
