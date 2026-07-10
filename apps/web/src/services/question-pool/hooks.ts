import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { questionPoolApi } from './api';
import { GeneratedQuestion, QuestionFilters } from './types';

export const useGeneratedQuestions = (filters?: QuestionFilters) => {
  return useQuery({
    queryKey: ['generated-questions', filters],
    queryFn: () => questionPoolApi.getGeneratedQuestions(filters),
  });
};

export const useApproveQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => questionPoolApi.approveQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-questions'] });
    },
  });
};

export const useRejectQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => questionPoolApi.rejectQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-questions'] });
    },
  });
};

export const usePublishQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => questionPoolApi.publishQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-questions'] });
    },
  });
};

export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<GeneratedQuestion> }) =>
      questionPoolApi.updateQuestion(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-questions'] });
    },
  });
};

export const useRegenerateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => questionPoolApi.regenerateQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-questions'] });
    },
  });
};
