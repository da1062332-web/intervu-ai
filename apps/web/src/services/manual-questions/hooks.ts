import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { manualQuestionsApi } from './api';
import { ManualQuestion, ManualQuestionFilters } from './types';

export const useManualQuestions = (filters?: ManualQuestionFilters) => {
  return useQuery({
    queryKey: ['manual-questions', filters],
    queryFn: () => manualQuestionsApi.getQuestions(filters),
  });
};

export const useManualQuestion = (id: string) => {
  return useQuery({
    queryKey: ['manual-question', id],
    queryFn: () => manualQuestionsApi.getQuestionById(id),
    enabled: !!id,
  });
};

export const useCreateManualQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ManualQuestion>) => manualQuestionsApi.createQuestion(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['manual-questions'] });
    },
  });
};

export const useUpdateManualQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
      currentStatus,
    }: {
      id: string;
      payload: Partial<ManualQuestion>;
      currentStatus?: string;
    }) => manualQuestionsApi.updateQuestion(id, payload, currentStatus),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['manual-questions'] });
      queryClient.invalidateQueries({ queryKey: ['manual-question', variables.id] });
    },
  });
};

export const useDeleteManualQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => manualQuestionsApi.deleteQuestion(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['manual-questions'] });
      queryClient.invalidateQueries({ queryKey: ['manual-question', id] });
    },
  });
};
