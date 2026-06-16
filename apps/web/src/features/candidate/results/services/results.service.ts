import {
  EvaluationResult,
  SkillScore,
  Recommendation,
  PerformanceSummary,
} from '../types/results.types';
import {
  mockEvaluationResult,
  mockSkillScores,
  mockRecommendations,
  mockPerformanceSummary,
} from '../mocks/results.mock';

// In the future, these will make actual API calls to:
// GET /api/v1/results/:id
// GET /api/v1/results/:id/recommendations
// GET /api/v1/users/me/performance-summary

export const resultsService = {
  async getResults(id: string): Promise<EvaluationResult & { skills: SkillScore[] }> {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    // In a real app we'd fetch using the id, mock ignores it for now
    if (!id) throw new Error('Result ID is required');

    return {
      ...mockEvaluationResult,
      id,
      skills: mockSkillScores,
    };
  },

  async getRecommendations(id: string): Promise<Recommendation[]> {
    if (!id) throw new Error('Result ID is required');
    await new Promise((resolve) => setTimeout(resolve, 400));
    return mockRecommendations;
  },

  async getPerformanceSummary(): Promise<PerformanceSummary> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return mockPerformanceSummary;
  },
};
