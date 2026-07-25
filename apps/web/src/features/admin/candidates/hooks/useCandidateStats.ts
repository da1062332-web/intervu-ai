'use client';

import { useQuery } from '@tanstack/react-query';
import { adminCandidateService } from '../services/candidate.service';
import { candidateQueryKeys } from './useCandidates';
import type { CandidateStats } from '../types/candidate.types';

export function useCandidateStats(id: string) {
  return useQuery<CandidateStats, Error>({
    queryKey: candidateQueryKeys.stats(id),
    queryFn: () => adminCandidateService.getCandidateStats(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}
