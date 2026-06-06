import { create } from 'zustand';

export interface CurrentTest {
  id: string;
  title: string;
  candidateName: string;
  submittedAt: string;
}

export interface SkillResult {
  skill: string;
  score: number;
  feedback: string;
}

export interface EvaluationResult {
  overallScore: number;
  confidenceScore: number;
  skills: SkillResult[];
}

export interface Recommendation {
  title: string;
  description: string;
}

export interface ResultsState {
  currentTest: CurrentTest | null;
  evaluationResult: EvaluationResult | null;
  recommendations: Recommendation[];
  loading: boolean;
  error: string | null;
  setCurrentTest: (test: CurrentTest | null) => void;
  setEvaluationResult: (result: EvaluationResult | null) => void;
  setRecommendations: (recommendations: Recommendation[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useResultsStore = create<ResultsState>((set) => ({
  currentTest: null,
  evaluationResult: null,
  recommendations: [],
  loading: false,
  error: null,
  setCurrentTest: (currentTest) => set({ currentTest }),
  setEvaluationResult: (evaluationResult) => set({ evaluationResult }),
  setRecommendations: (recommendations) => set({ recommendations }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

export const mockResult = {
  currentTest: {
    id: 'test-1',
    title: 'Frontend React Assessment',
    candidateName: 'John Doe',
    submittedAt: '2026-06-02T10:15:00Z',
  },
  evaluationResult: {
    overallScore: 86,
    confidenceScore: 91,
    skills: [
      {
        skill: 'React',
        score: 92,
        feedback: 'Strong understanding of hooks and state management.',
      },
      {
        skill: 'TypeScript',
        score: 84,
        feedback: 'Good typing practices but can improve generics usage.',
      },
      {
        skill: 'System Design',
        score: 78,
        feedback: 'Understands fundamentals but lacks depth in scalability.',
      },
    ],
  },
  recommendations: [
    {
      title: 'Advanced TypeScript',
      description: 'Practice utility types and generic constraints.',
    },
  ],
};
