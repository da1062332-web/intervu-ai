import { useMemo, useCallback } from 'react';
import { useQueries } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

export function useDashboardKPIs() {
  const results = useQueries({
    queries: [
      {
        queryKey: ['admin-dashboard', 'total-assessments'],
        queryFn: dashboardService.getTotalAssessments,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
      },
      {
        queryKey: ['admin-dashboard', 'active-assessments'],
        queryFn: dashboardService.getActiveAssessments,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
      },
      {
        queryKey: ['admin-dashboard', 'total-candidates'],
        queryFn: dashboardService.getTotalCandidates,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
      },
      {
        queryKey: ['admin-dashboard', 'completed-tests'],
        queryFn: dashboardService.getCompletedTests,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
      },
      {
        queryKey: ['admin-dashboard', 'average-score'],
        queryFn: dashboardService.getAverageScore,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
      },
      {
        queryKey: ['admin-dashboard', 'question-bank-count'],
        queryFn: dashboardService.getQuestionBankCount,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
      },
    ],
  });

  const isLoading = results.every((result) => result.isLoading);
  const isError = results.some((result) => result.isError);

  const totalAssessments = results[0]?.data;
  const activeAssessments = results[1]?.data;
  const totalCandidates = results[2]?.data;
  const completedTests = results[3]?.data;
  const averageScore = results[4]?.data;
  const questionBankCount = results[5]?.data;

  const data = useMemo(
    () => ({
      totalAssessments,
      activeAssessments,
      totalCandidates,
      completedTests,
      averageScore,
      questionBankCount,
    }),
    [
      totalAssessments,
      activeAssessments,
      totalCandidates,
      completedTests,
      averageScore,
      questionBankCount,
    ],
  );

  const refetch = useCallback(() => {
    results.forEach((r) => r.refetch());
  }, [results]);

  return {
    data,
    isLoading,
    isError,
    refetch,
    loadingStates: {
      totalAssessments: results[0]?.isLoading,
      activeAssessments: results[1]?.isLoading,
      totalCandidates: results[2]?.isLoading,
      completedTests: results[3]?.isLoading,
      averageScore: results[4]?.isLoading,
      questionBankCount: results[5]?.isLoading,
    },
  };
}
