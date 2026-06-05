'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/api/dashboard.api';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardQueryKeys.all, 'stats'] as const,
  summary: () => [...dashboardQueryKeys.all, 'summary'] as const,
  activity: () => [...dashboardQueryKeys.all, 'activity'] as const,
} as const;

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * React Query hook for dashboard statistics.
 * Follows the Service → Hook → Component architecture.
 *
 * Usage: const { data: stats, isLoading, isError } = useDashboardStats();
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardQueryKeys.stats(),
    queryFn: () => dashboardApi.getStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: true,
  });
}
