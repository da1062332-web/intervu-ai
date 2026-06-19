import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { topicWeightagesApi, TopicWeightage } from './api';
import { toast } from 'sonner';
import { useTopicMappingStore } from '@/features/topic-section-mapping/store/topic-mapping.store';

export const topicWeightageKeys = {
  all: ['topic-weightages'] as const,
  section: (sectionId: string) => [...topicWeightageKeys.all, sectionId] as const,
};

export const useWeightages = (sectionId: string | null) => {
  const setWeightages = useTopicMappingStore((state) => state.setWeightages);

  return useQuery({
    queryKey: topicWeightageKeys.section(sectionId as string),
    queryFn: async () => {
      if (!sectionId) return [];
      const data = await topicWeightagesApi.getWeightages(sectionId);
      
      const weightageMap: Record<string, number> = {};
      data.forEach((w) => {
        weightageMap[w.topicId] = w.weightagePercentage;
      });
      setWeightages(weightageMap);

      return data;
    },
    enabled: !!sectionId,
  });
};

export const useCreateWeightage = (sectionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ topicId, weightagePercentage }: { topicId: string; weightagePercentage: number }) =>
      topicWeightagesApi.createWeightage(sectionId, topicId, weightagePercentage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: topicWeightageKeys.section(sectionId) });
      toast.success('Weightage saved.');
    },
    onError: () => {
      toast.error('Failed to save weightage.');
    },
  });
};

export const useUpdateWeightage = (sectionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, weightagePercentage }: { id: string; weightagePercentage: number }) =>
      topicWeightagesApi.updateWeightage(id, weightagePercentage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: topicWeightageKeys.section(sectionId) });
      toast.success('Weightage updated.');
    },
    onError: () => {
      toast.error('Failed to update weightage.');
    },
  });
};

export const useDeleteWeightage = (sectionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => topicWeightagesApi.deleteWeightage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: topicWeightageKeys.section(sectionId) });
      toast.success('Weightage removed.');
    },
    onError: () => {
      toast.error('Failed to remove weightage.');
    },
  });
};
