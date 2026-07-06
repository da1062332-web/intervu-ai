import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';

export interface CandidateProgressData {
  trend: Array<{ date: string; score: number; label: string }>;
  skills: Array<{ topic: string; score: number }>;
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
  bestScore: number;
}

export const useCandidateProgress = () => {
  return useQuery({
    queryKey: ['candidate-progress'],
    queryFn: async () => {
      return apiClient.request<CandidateProgressData>('/reports/progress');
    },
  });
};
