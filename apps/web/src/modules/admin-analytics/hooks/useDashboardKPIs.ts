import { useMemo, useCallback } from 'react';
import { useQueries } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

export function useDashboardKPIs() {
  const results = useQueries({
    queries: [
      {
        queryKey: ['admin-dashboard', 'total-assessments'],
        queryFn: dashboardService.getTotalAssessments,
      },
      {
        queryKey: ['admin-dashboard', 'active-assessments'],
        queryFn: dashboardService.getActiveAssessments,
      },
      {
        queryKey: ['admin-dashboard', 'total-candidates'],
        queryFn: dashboardService.getTotalCandidates,
      },
      {
        queryKey: ['admin-dashboard', 'completed-tests'],
        queryFn: dashboardService.getCompletedTests,
      },
      {
        queryKey: ['admin-dashboard', 'average-score'],
        queryFn: dashboardService.getAverageScore,
      },
      {
        queryKey: ['admin-dashboard', 'question-bank-count'],
        queryFn: dashboardService.getQuestionBankCount,
      },
    ],
  });

  const isLoading = results.some((result) => result.isLoading);
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
  };
}
