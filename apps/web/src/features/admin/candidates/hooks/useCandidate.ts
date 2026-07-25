'use client';

import { useQuery } from '@tanstack/react-query';
import { adminCandidateService } from '../services/candidate.service';
import { candidateQueryKeys } from './useCandidates';
import type { CandidateDetails } from '../types/candidate.types';

export function useCandidate(id: string) {
  return useQuery<CandidateDetails, Error>({
    queryKey: candidateQueryKeys.details(id),
    queryFn: () => adminCandidateService.getCandidateDetails(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}
