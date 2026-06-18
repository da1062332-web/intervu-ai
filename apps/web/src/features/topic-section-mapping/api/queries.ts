import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { SectionTopicResponse } from '@intervu-ai/contracts';
import { toast } from 'sonner';

export const topicSectionKeys = {
  all: ['section-topics'] as const,
  section: (sectionId: string) => [...topicSectionKeys.all, sectionId] as const,
};

export const useSectionTopics = (sectionId: string) => {
  return useQuery({
    queryKey: topicSectionKeys.section(sectionId),
    queryFn: () => apiClient.request<SectionTopicResponse[]>(`/admin/sections/${sectionId}/topics`),
    enabled: !!sectionId,
  });
};

export const useAssignTopic = (sectionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (topicId: string) =>
      apiClient.request(`/admin/sections/${sectionId}/topics`, {
        method: 'POST',
        body: { topicId },
      }),
    onMutate: async (newTopicId) => {
      await queryClient.cancelQueries({ queryKey: topicSectionKeys.section(sectionId) });
      const previousTopics = queryClient.getQueryData<SectionTopicResponse[]>(
        topicSectionKeys.section(sectionId),
      );

      queryClient.setQueryData<SectionTopicResponse[]>(
        topicSectionKeys.section(sectionId),
        (old) => {
          const optimisticTopic: SectionTopicResponse = {
            topicId: newTopicId,
            topicName: 'Assigning...',
            topicCode: '...',
          };
          return [...(old || []), optimisticTopic];
        },
      );

      return { previousTopics };
    },
    onError: (err, newTopicId, context) => {
      queryClient.setQueryData(topicSectionKeys.section(sectionId), context?.previousTopics);
      toast.error('Topic already mapped or an error occurred.');
    },
    onSuccess: () => {
      toast.success('Topic assigned.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: topicSectionKeys.section(sectionId) });
    },
  });
};

export const useRemoveTopic = (sectionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (topicId: string) =>
      apiClient.request(`/admin/sections/${sectionId}/topics/${topicId}`, {
        method: 'DELETE',
      }),
    onMutate: async (topicId) => {
      await queryClient.cancelQueries({ queryKey: topicSectionKeys.section(sectionId) });
      const previousTopics = queryClient.getQueryData<SectionTopicResponse[]>(
        topicSectionKeys.section(sectionId),
      );

      queryClient.setQueryData<SectionTopicResponse[]>(
        topicSectionKeys.section(sectionId),
        (old) => {
          return (old || []).filter((topic) => topic.topicId !== topicId);
        },
      );

      return { previousTopics };
    },
    onError: (err, topicId, context) => {
      queryClient.setQueryData(topicSectionKeys.section(sectionId), context?.previousTopics);
      toast.error('Unable to remove mapping.');
    },
    onSuccess: () => {
      toast.success('Topic removed.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: topicSectionKeys.section(sectionId) });
    },
  });
};

export const useAdminTopics = () => {
  return useQuery({
    queryKey: ['admin-topics'],
    queryFn: () => apiClient.request<any[]>('/admin/topics').catch(() => []), // fallback to empty if missing
  });
};
