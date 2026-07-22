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

  const data = {
    totalAssessments: results[0].data,
    activeAssessments: results[1].data,
    totalCandidates: results[2].data,
    completedTests: results[3].data,
    averageScore: results[4].data,
    questionBankCount: results[5].data,
  };

  return {
    data,
    isLoading,
    isError,
    refetch: () => results.forEach((r) => r.refetch()),
  };
}
