import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { questionGenerationApi } from './api';
import { GeneratedQuestion, GenerationHistoryEntry } from './types';

export const useGenerateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, payload }: { templateId: string; payload: any }) =>
      questionGenerationApi.generateQuestion(templateId, payload),
    onSuccess: () => {
      // Invalidate generated questions list so review table updates
      queryClient.invalidateQueries({ queryKey: ['generated-questions'] });
    },
  });
};

export const useGenerateBatch = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      count,
      payload,
    }: {
      templateId: string;
      count: number;
      payload: any;
    }) => questionGenerationApi.generateBatch(templateId, count, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-questions'] });
      queryClient.invalidateQueries({ queryKey: ['generation-history'] });
    },
  });
};

export const useGenerationHistory = (templateId?: string) => {
  return useQuery({
    queryKey: ['generation-history', templateId],
    queryFn: () => questionGenerationApi.getHistory(templateId),
  });
};
