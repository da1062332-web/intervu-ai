'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/api/dashboard.api';
import { dashboardQueryKeys } from './use-dashboard-stats';

export function useAnalyticsSummary() {
  return useQuery({
    queryKey: dashboardQueryKeys.summary(),
    queryFn: () => dashboardApi.getAnalyticsSummary(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: true,
  });
}
