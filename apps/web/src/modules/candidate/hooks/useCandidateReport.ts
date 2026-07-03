import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';

export interface ReportData {
  id: string;
  testName: string;
  completedAt: string;
  score: number;
  timeSpent: number;
  totalTime: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  sectionScores: { name: string; score: number }[];
}

export const useCandidateReport = (attemptId: string) => {
  return useQuery({
    queryKey: ['candidate-report', attemptId],
    queryFn: async (): Promise<ReportData> => {
      try {
        const response = await apiClient.request<ReportData>(`/reports/candidate/${attemptId}`);
        return response;
      } catch (error) {
        console.error('Failed to fetch report:', error);
        throw error;
      }
    },
    enabled: !!attemptId,
  });
};
