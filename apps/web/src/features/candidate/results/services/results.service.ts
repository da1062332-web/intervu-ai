import { apiClient } from '@/services/api/client';
import {
  EvaluationResult,
  SkillScore,
  Recommendation,
  PerformanceSummary,
} from '../types/results.types';

export const resultsService = {
  async getResults(id: string): Promise<EvaluationResult & { skills: SkillScore[] }> {
    if (!id) throw new Error('Result ID is required');
    const response = await apiClient.request<any>(`/results/${id}`);

    // Map backend DTO to frontend EvaluationResult
    return {
      id: response.id,
      testId: response.testId || '',
      candidateName: '', // Fallback, would come from user profile in reality
      testName: 'Assessment', // Fallback, could be fetched or returned from backend
      overallScore: response.overallScore,
      confidenceScore: response.confidenceScore || 0,
      totalQuestions: response.totalQuestions || 0,
      correctAnswers: response.correctAnswers || 0,
      submittedAt: response.evaluatedAt?.toString() || new Date().toISOString(),
      skills:
        response.skillScores?.map((skill: any) => ({
          id: skill.id || skill.skill,
          name: skill.skill,
          score: skill.score,
          feedback: skill.feedback,
        })) || [],
    };
  },

  async getRecommendations(id: string): Promise<Recommendation[]> {
    if (!id) throw new Error('Result ID is required');
    return apiClient.request<Recommendation[]>(`/results/${id}/recommendations`);
  },

  async getPerformanceSummary(): Promise<PerformanceSummary> {
    return apiClient.request<PerformanceSummary>('/users/me/performance-summary');
  },
};
