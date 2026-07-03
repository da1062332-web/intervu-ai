import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';

export interface ProgressData {
  trend: { date: string; score: number; label: string }[];
  skills: { topic: string; score: number }[];
  difficulty: {
    easy: { attempted: number; correct: number };
    medium: { attempted: number; correct: number };
    hard: { attempted: number; correct: number };
  };
  overview: {
    averageScore: number;
    topPercentileScore: number;
    totalAssessments: number;
    completionRate: number;
  };
}

export const useProgress = () => {
  return useQuery({
    queryKey: ['candidate-progress'],
    queryFn: async (): Promise<ProgressData> => {
      try {
        const response = await apiClient.request<ProgressData>('/reports/progress');
        return response;
      } catch (error) {
        console.error('Failed to fetch progress:', error);
        throw error;
      }
    },
  });
};
