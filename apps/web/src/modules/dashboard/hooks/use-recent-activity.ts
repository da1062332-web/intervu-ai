'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/api/dashboard.api';
import { dashboardQueryKeys } from './use-dashboard-stats';

export function useRecentActivity() {
  return useQuery({
    queryKey: dashboardQueryKeys.activity(),
    queryFn: () => dashboardApi.getRecentActivity(),
    staleTime: 2 * 60 * 1000, // 2 mins, activity might be more frequent
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: true,
  });
}
