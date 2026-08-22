'use client';

import { useQuery } from '@tanstack/react-query';
import { adminCandidateService } from '../services/candidate.service';
import type { CandidateListParams, CandidateListResponse } from '../types/candidate.types';

export const candidateQueryKeys = {
  all: ['admin', 'candidates'] as const,
  list: (params: Record<string, unknown>) => [...candidateQueryKeys.all, 'list', params] as const,
  details: (id: string) => [...candidateQueryKeys.all, 'details', id] as const,
  stats: (id: string) => [...candidateQueryKeys.all, 'stats', id] as const,
  tests: (id: string, params: Record<string, unknown>) =>
    [...candidateQueryKeys.all, 'tests', id, params] as const,
};

export function useCandidates(params: CandidateListParams = {}) {
  return useQuery<CandidateListResponse, Error>({
    queryKey: candidateQueryKeys.list(params as Record<string, unknown>),
    queryFn: () => adminCandidateService.getCandidates(params),
    placeholderData: (previousData) => previousData,
    staleTime: 5000,
    refetchOnWindowFocus: true,
  });
}
