import { create } from 'zustand';
import { EvaluationResult, SkillScore, Recommendation, PerformanceSummary } from '../types/results.types';

interface ResultsState {
  evaluation: EvaluationResult | null;
  skills: SkillScore[];
  recommendations: Recommendation[];
  performanceSummary: PerformanceSummary | null;
  loading: boolean;
  error: string | null;

  setResults: (evaluation: EvaluationResult, skills: SkillScore[]) => void;
  setRecommendations: (recommendations: Recommendation[]) => void;
  setPerformanceSummary: (summary: PerformanceSummary) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useResultsStore = create<ResultsState>((set) => ({
  evaluation: null,
  skills: [],
  recommendations: [],
  performanceSummary: null,
  loading: true,
  error: null,

  setResults: (evaluation, skills) => set({ evaluation, skills }),
  setRecommendations: (recommendations) => set({ recommendations }),
  setPerformanceSummary: (performanceSummary) => set({ performanceSummary }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
