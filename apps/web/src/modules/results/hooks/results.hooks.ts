import { useQuery } from '@tanstack/react-query';
import { resultApi } from '../api/results.api';

export const resultKeys = {
  all: ['results'] as const,
  dashboard: () => [...resultKeys.all, 'dashboard'] as const,
  latest: () => [...resultKeys.all, 'latest'] as const,
  candidate: (candidateId: string, page: number, limit: number) => [...resultKeys.all, 'candidate', candidateId, { page, limit }] as const,
  detail: (attemptId: string) => [...resultKeys.all, 'detail', attemptId] as const,
  status: (attemptId: string) => [...resultKeys.all, 'status', attemptId] as const,
  analytics: (attemptId: string) => [...resultKeys.all, 'analytics', attemptId] as const,
  analysis: (attemptId: string) => [...resultKeys.all, 'analysis', attemptId] as const,
  recommendations: (attemptId: string) => [...resultKeys.all, 'recommendations', attemptId] as const,
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
      return 15000;
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
