import { create } from 'zustand';

interface TemplatePreviewState {
  solutionTemplate: string;
  explanationTemplate: string;
  previewInput: string;
  previewResult: any;
  isDirty: boolean;
  
  setSolutionTemplate: (val: string) => void;
  setExplanationTemplate: (val: string) => void;
  setPreviewInput: (val: string) => void;
  setPreviewResult: (val: any) => void;
  setDirty: (val: boolean) => void;
  reset: () => void;
}

export const useTemplatePreviewStore = create<TemplatePreviewState>((set) => ({
  solutionTemplate: '',
  explanationTemplate: '',
  previewInput: '{\n  "answer": "42"\n}',
  previewResult: null,
  isDirty: false,

  setSolutionTemplate: (solutionTemplate) => set({ solutionTemplate, isDirty: true }),
  setExplanationTemplate: (explanationTemplate) => set({ explanationTemplate, isDirty: true }),
  setPreviewInput: (previewInput) => set({ previewInput }),
  setPreviewResult: (previewResult) => set({ previewResult }),
  setDirty: (isDirty) => set({ isDirty }),
  reset: () => set({
    solutionTemplate: '',
    explanationTemplate: '',
    previewInput: '{\n  "answer": "42"\n}',
    previewResult: null,
    isDirty: false,
  }),
}));
