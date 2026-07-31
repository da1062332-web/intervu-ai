import { useQuery } from '@tanstack/react-query';
import { resultApi } from '../api/results.api';

export const resultKeys = {
  all: ['results'] as const,
  dashboard: () => [...resultKeys.all, 'dashboard'] as const,
  latest: () => [...resultKeys.all, 'latest'] as const,
  candidate: (candidateId: string, page: number, limit: number) =>
    [...resultKeys.all, 'candidate', candidateId, { page, limit }] as const,
  detail: (attemptId: string) => [...resultKeys.all, 'detail', attemptId] as const,
  status: (attemptId: string) => [...resultKeys.all, 'status', attemptId] as const,
  analytics: (attemptId: string) => [...resultKeys.all, 'analytics', attemptId] as const,
  analysis: (attemptId: string) => [...resultKeys.all, 'analysis', attemptId] as const,
  recommendations: (attemptId: string) =>
    [...resultKeys.all, 'recommendations', attemptId] as const,
  performanceDashboard: (attemptId: string) =>
    [...resultKeys.all, 'performanceDashboard', attemptId] as const,
  aiAnalysis: (attemptId: string) =>
    [...resultKeys.all, 'aiAnalysis', attemptId] as const,
};

export function useDashboardWidgets() {
  return useQuery({
    queryKey: resultKeys.dashboard(),
    queryFn: resultApi.getDashboardWidgets,
  });
}

export function useLatestResult() {
  return useQuery({
    queryKey: resultKeys.latest(),
    queryFn: resultApi.getLatestResult,
  });
}

export function useCandidateResults(candidateId: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: resultKeys.candidate(candidateId, page, limit),
    queryFn: () => resultApi.listCandidateResults(candidateId, page, limit),
    enabled: !!candidateId,
  });
}

export function useResultDetails(attemptId: string) {
  return useQuery({
    queryKey: resultKeys.detail(attemptId),
    queryFn: () => resultApi.getResultDetails(attemptId),
    enabled: !!attemptId,
    // Keep retrying while result is not yet generated, but stop on 401/403 authentication errors
    retry: (failureCount, error: any) => {
      const status = error?.response?.status || error?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 5;
    },
    retryDelay: 2000,
    refetchInterval: (query) => {
      // Stop polling once we have data or if auth error
      if (query.state?.data) return false;
      const status = (query.state?.error as any)?.response?.status;
      if (status === 401 || status === 403) return false;
      return 2000;
    },
  });
}

export function useResultStatus(attemptId: string) {
  return useQuery({
    queryKey: resultKeys.status(attemptId),
    queryFn: () => resultApi.getStatus(attemptId),
    enabled: !!attemptId,
    refetchInterval: (query) => {
      const status = query.state?.data?.status;
      if (status === 'COMPLETED' || status === 'FAILED') {
        return false;
      }
      return 2000;
    },
  });
}

export function useResultAnalytics(attemptId: string) {
  return useQuery({
    queryKey: resultKeys.analytics(attemptId),
    queryFn: () => resultApi.getAnalytics(attemptId),
    enabled: !!attemptId,
  });
}

export function useResultAnalysis(attemptId: string) {
  return useQuery({
    queryKey: resultKeys.analysis(attemptId),
    queryFn: () => resultApi.getAnalysis(attemptId),
    enabled: !!attemptId,
  });
}

export function useResultRecommendations(attemptId: string) {
  return useQuery({
    queryKey: resultKeys.recommendations(attemptId),
    queryFn: () => resultApi.getRecommendations(attemptId),
    enabled: !!attemptId,
  });
}

export function usePerformanceDashboard(attemptId: string) {
  return useQuery({
    queryKey: resultKeys.performanceDashboard(attemptId),
    queryFn: () => resultApi.getPerformanceDashboard(attemptId),
    enabled: !!attemptId,
    retry: (failureCount, error: any) => {
      const status = error?.response?.status || error?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 3;
    },
  });
}

export function useAiAnalysis(attemptId: string) {
  return useQuery({
    queryKey: resultKeys.aiAnalysis(attemptId),
    queryFn: () => resultApi.getAiAnalysis(attemptId),
    enabled: !!attemptId,
    staleTime: 5 * 60 * 1000, // Cache for 5 min — AI calls are expensive
    retry: (failureCount, error: any) => {
      const status = error?.response?.status || error?.status;
      if (status === 401 || status === 403) return false;
      return failureCount < 2;
    },
  });
}
