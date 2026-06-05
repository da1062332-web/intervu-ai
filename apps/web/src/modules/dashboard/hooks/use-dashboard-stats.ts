'use client';

import { useQuery } from '@tanstack/react-query';

import type { DashboardStats } from '@/types/dashboard.types';

// ─── Stub Data (replace with real API service call) ───────────────────────────

async function fetchDashboardStats(): Promise<DashboardStats> {
  // TODO: Replace with real API call via dashboardService
  // e.g. return dashboardService.getStats();
  await new Promise((resolve) => setTimeout(resolve, 800)); // Simulated latency

  return {
    totalAssessments: 0,
    activeTests: 0,
    completedResults: 0,
    candidatesPassed: 0,
  };
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardQueryKeys.all, 'stats'] as const,
} as const;

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * React Query hook for dashboard statistics.
 * Follows the Service → Hook → Component architecture.
 *
 * Usage: const { data: stats, isLoading } = useDashboardStats();
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardQueryKeys.stats(),
    queryFn: fetchDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}
