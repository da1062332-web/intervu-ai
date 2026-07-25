'use client';

import { useQuery } from '@tanstack/react-query';
import { adminCandidateService } from '../services/candidate.service';
import { candidateQueryKeys } from './useCandidates';
import type { CandidateTestHistoryParams, CandidateTestHistoryResponse } from '../types/candidate.types';

export function useCandidateTests(id: string, params: CandidateTestHistoryParams = {}) {
  return useQuery<CandidateTestHistoryResponse, Error>({
    queryKey: candidateQueryKeys.tests(id, params as Record<string, unknown>),
    queryFn: () => adminCandidateService.getCandidateTests(id, params),
    enabled: !!id,
    placeholderData: (previousData) => previousData,
    staleTime: 60 * 1000,
  });
}
