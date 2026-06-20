import { create } from 'zustand';
import type {
  BlueprintSectionPayload,
  ValidationResult,
  BlueprintPreviewData,
} from '@/services/blueprints/types';

interface BlueprintBuilderState {
  selectedConfigId: string;
  selectedStyleProfileId: string;
  sections: BlueprintSectionPayload[];
  validation: ValidationResult | null;
  preview: BlueprintPreviewData | null;
  isDirty: boolean;

  setConfig: (configId: string) => void;
  setProfile: (profileId: string) => void;
  updateSection: (sectionId: string, sectionPayload: Partial<BlueprintSectionPayload>) => void;
  setValidation: (validation: ValidationResult | null) => void;
  setPreview: (preview: BlueprintPreviewData | null) => void;
  reset: () => void;
  initFromExisting: (
    configId: string,
    styleProfileId: string,
    sections: BlueprintSectionPayload[],
  ) => void;
}

const initialState = {
  selectedConfigId: '',
  selectedStyleProfileId: '',
  sections: [],
  validation: null,
  preview: null,
  isDirty: false,
};

export const useBlueprintBuilderStore = create<BlueprintBuilderState>((set) => ({
  ...initialState,

  setConfig: (configId) => set({ selectedConfigId: configId, isDirty: true }),

  setProfile: (profileId) => set({ selectedStyleProfileId: profileId, isDirty: true }),

  updateSection: (sectionId, sectionPayload) =>
    set((state) => {
      const existingSectionIndex = state.sections.findIndex((s) => s.sectionId === sectionId);

      let newSections = [...state.sections];

      if (existingSectionIndex >= 0) {
        newSections[existingSectionIndex] = {
          ...newSections[existingSectionIndex],
          ...sectionPayload,
        };
      } else {
        newSections.push({
          sectionId,
          questionCount: 0,
          topicAllocations: [],
          difficultyAllocation: { easy: 0, medium: 0, hard: 0 },
          templateTypes: [],
          ...sectionPayload,
        });
      }

      return { sections: newSections, isDirty: true };
    }),

  setValidation: (validation) => set({ validation }),

  setPreview: (preview) => set({ preview }),

  reset: () => set(initialState),

  initFromExisting: (configId, styleProfileId, sections) =>
    set({
      selectedConfigId: configId,
      selectedStyleProfileId: styleProfileId,
      sections,
      isDirty: false,
      validation: null,
      preview: null,
    }),
}));
