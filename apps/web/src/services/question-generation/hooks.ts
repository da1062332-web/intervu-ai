import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { questionGenerationApi } from './api';
import type {
  QuestionGenerationRequest,
  ValidateQuestionRequest,
  GenerationHistoryEntry,
} from './types';

/**
 * useGenerateQuestion
 *
 * Full generation + persistence flow.
 * Invalidates question-pool and generation-history caches on success.
 */
export const useGenerateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: QuestionGenerationRequest) => questionGenerationApi.generate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-pool'] });
      queryClient.invalidateQueries({ queryKey: ['generated-questions'] });
    },
  });
};

/**
 * usePreviewQuestion
 *
 * Preview-only — never persists, no cache invalidation needed.
 */
export const usePreviewQuestion = () => {
  return useMutation({
    mutationFn: (payload: QuestionGenerationRequest) => questionGenerationApi.preview(payload),
  });
};

/**
 * useValidateQuestion
 *
 * Validates a question against strategy-specific rules.
 * Does not persist.
 */
export const useValidateQuestion = () => {
  return useMutation({
    mutationFn: (payload: ValidateQuestionRequest) => questionGenerationApi.validate(payload),
  });
};

// ─── Legacy / Bulk Generation Hooks ──────────────────────────────────────────

export const useGenerateBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { templateId: string; count: number; context?: any }) =>
      questionGenerationApi.batch(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['generation-history', variables.templateId] });
    },
  });
};

export const useGenerationHistory = (templateId?: string) => {
  return useQuery({
    queryKey: ['generation-history', templateId],
    queryFn: async (): Promise<any[]> => {
      if (!templateId) return [];
      return questionGenerationApi.getJobs(templateId);
    },
    enabled: !!templateId,
    refetchInterval: (query) => {
      // Poll every 3 seconds if any jobs are in progress or pending
      const jobs = query.state.data as any[] | undefined;
      const isActive = jobs?.some(
        (job) => job.status === 'IN_PROGRESS' || job.status === 'PENDING',
      );
      return isActive ? 3000 : false;
    },
  });
};

export const useGenerationAuditLogs = (jobId?: string) => {
  return useQuery({
    queryKey: ['generation-audit', jobId],
    queryFn: async (): Promise<any[]> => {
      if (!jobId) return [];
      return questionGenerationApi.getAuditLogs(jobId);
    },
    enabled: !!jobId,
  });
};
