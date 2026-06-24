import { create } from 'zustand';

export interface ValidationLayerDetail {
  status: 'PASS' | 'FAIL' | 'WARNING';
  errors: string[];
}

export interface ValidationBreakdown {
  configuration: ValidationLayerDetail;
  knowledge: ValidationLayerDetail;
  templates: ValidationLayerDetail;
  blueprint: ValidationLayerDetail;
}

export interface SystemValidationResult {
  valid: boolean;
  score: number;
  errors: string[];
  breakdown?: ValidationBreakdown;
}

interface SystemValidationState {
  validationResult: SystemValidationResult | null;
  score: number;
  errors: string[];
  loading: boolean;
  error: string | null;

  setValidationResult: (result: SystemValidationResult | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  validationResult: null,
  score: 0,
  errors: [],
  loading: false,
  error: null,
};

export const useSystemValidationStore = create<SystemValidationState>((set) => ({
  ...initialState,

  setValidationResult: (result) =>
    set({
      validationResult: result,
      score: result ? result.score : 0,
      errors: result ? result.errors : [],
      error: null,
    }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
