import { create } from 'zustand';
import {
  AvailableTest,
  ActiveTest,
  AttemptHistory,
  SkillProgress,
  CandidateRecommendations,
  CandidateDashboardData,
} from '../types/candidateDashboard.types';

export interface CandidateDashboardState {
  availableTests: AvailableTest[];
  activeTests: ActiveTest[];
  completedAttempts: AttemptHistory[];
  recommendations: CandidateRecommendations | null;
  skillProgress: SkillProgress[];
  loading: boolean;
  error: string | null;

  setDashboard: (data: CandidateDashboardData) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  availableTests: [],
  activeTests: [],
  completedAttempts: [],
  recommendations: null,
  skillProgress: [],
  loading: true,
  error: null,
};

export const useCandidateDashboardStore = create<CandidateDashboardState>((set) => ({
  ...initialState,
  setDashboard: (data) =>
    set({
      availableTests: data.availableTests,
      activeTests: data.activeTests,
      completedAttempts: data.completedAttempts,
      recommendations: data.recommendations,
      skillProgress: data.skillProgress,
      loading: false,
      error: null,
    }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  reset: () => set(initialState),
}));
