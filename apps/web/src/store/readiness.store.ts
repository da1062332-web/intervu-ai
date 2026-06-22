import { create } from 'zustand';

export interface ReadinessCheck {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message?: string;
}

export interface ReadinessFix {
  type: string;
  message: string;
  link?: string;
  tab?: string;
}

export interface ReadinessReportDetails {
  layerBreakdown: {
    configuration: 'PASS' | 'FAIL' | 'WARNING';
    knowledge: 'PASS' | 'FAIL' | 'WARNING';
    templates: 'PASS' | 'FAIL' | 'WARNING';
    blueprint: 'PASS' | 'FAIL' | 'WARNING';
  };
  fixes: ReadinessFix[];
}

export interface ReadinessReport {
  score: number;
  status: 'NOT_READY' | 'PARTIALLY_READY' | 'READY';
  checks: ReadinessCheck[];
  report?: ReadinessReportDetails;
}

interface ReadinessState {
  score: number;
  status: 'NOT_READY' | 'PARTIALLY_READY' | 'READY';
  checks: ReadinessCheck[];
  report: ReadinessReportDetails | null;
  isGenerating: boolean;
  error: string | null;

  setReadinessReport: (report: ReadinessReport) => void;
  setGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  score: 0,
  status: 'NOT_READY' as const,
  checks: [],
  report: null,
  isGenerating: false,
  error: null,
};

export const useReadinessStore = create<ReadinessState>((set) => ({
  ...initialState,

  setReadinessReport: (report) =>
    set({
      score: report.score,
      status: report.status,
      checks: report.checks,
      report: report.report || null,
      error: null,
    }),

  setGenerating: (isGenerating) => set({ isGenerating }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
