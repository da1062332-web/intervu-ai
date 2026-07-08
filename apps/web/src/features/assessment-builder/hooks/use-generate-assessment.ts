import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assessmentGenerationApi } from '../api/assessment-generation.api';
import type { GenerationRequest } from '@intervu-ai/contracts';
import { toast } from 'sonner';
import type { Assessment, GeneratedQuestion } from '../types';

export const useGenerateAssessment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GenerationRequest) => assessmentGenerationApi.generateAssessment(payload),
    onSuccess: (response) => {
      // The backend now returns a jobId in response (e.g. response.jobId or response.data.jobId)
      // The calling component will use this jobId to start polling.
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      toast.success('Assessment generation job enqueued successfully');
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Failed to enqueue assessment generation';
      toast.error(msg);
    },
    retry: 2,
  });
};

export const useJobPolling = (jobId: string | null) => {
  return useQuery({
    queryKey: ['generationJob', jobId],
    queryFn: () => assessmentGenerationApi.getGenerationJob(jobId!),
    enabled: !!jobId,
    // Poll every 2 seconds while the job is active/waiting
    refetchInterval: (query) => {
      const status = query.state?.data?.status;
      if (status === 'completed' || status === 'failed') {
        return false;
      }
      return 2000;
    },
    retry: 3,
    retryDelay: 1000,
  });
};

export const useAssessment = (id: string) => {
  return useQuery<Assessment>({
    queryKey: ['assessment', id],
    queryFn: () => assessmentGenerationApi.getAssessment(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

export const useQuestionsPool = (filters?: any) => {
  return useQuery<{ data: GeneratedQuestion[]; meta: any }>({
    queryKey: ['questions', filters],
    queryFn: () => assessmentGenerationApi.getQuestions(filters),
    staleTime: 5 * 60 * 1000,
  });
};
