import { create } from 'zustand';
import type {
  GenerationStrategy,
  QuestionPreviewResult,
  ValidationReport,
} from '@/services/question-generation/types';

interface StrategyConfigState {
  currentStrategy: GenerationStrategy;

  /**
   * Registry-shaped configs — each strategy has its own isolated config.
   * Access current: configs[currentStrategy]
   * Changing strategy preserves other strategies' configs (non-destructive).
   */
  configs: Record<GenerationStrategy, Record<string, unknown>>;

  previewResult: QuestionPreviewResult | null;
  validationResult: ValidationReport | null;
  hasUnsavedChanges: boolean;

  // Actions
  setStrategy: (strategy: GenerationStrategy) => void;
  updateConfig: (patch: Record<string, unknown>) => void;
  resetConfig: () => void;
  setPreviewResult: (result: QuestionPreviewResult | null) => void;
  setValidationResult: (report: ValidationReport | null) => void;
  markSaved: () => void;
}

const EMPTY_CONFIGS: Record<GenerationStrategy, Record<string, unknown>> = {
  VARIABLE: {},
  DATASET: {},
  HYBRID: {},
};

export const useStrategyConfigStore = create<StrategyConfigState>((set, get) => ({
  currentStrategy: 'VARIABLE',
  configs: { ...EMPTY_CONFIGS },
  previewResult: null,
  validationResult: null,
  hasUnsavedChanges: false,

  /**
   * setStrategy — changes the active strategy.
   * - Clears previewResult and validationResult (they belong to old strategy)
   * - Preserves configs for ALL strategies (non-destructive)
   * - Resets unsaved changes flag
   */
  setStrategy: (strategy) =>
    set({
      currentStrategy: strategy,
      previewResult: null,
      validationResult: null,
      hasUnsavedChanges: false,
    }),

  /**
   * updateConfig — patches the config for the CURRENT strategy only.
   * Marks the store as having unsaved changes.
   */
  updateConfig: (patch) => {
    const { currentStrategy, configs } = get();
    set({
      configs: {
        ...configs,
        [currentStrategy]: { ...configs[currentStrategy], ...patch },
      },
      hasUnsavedChanges: true,
    });
  },

  /**
   * resetConfig — clears the config for the CURRENT strategy only.
   */
  resetConfig: () => {
    const { currentStrategy, configs } = get();
    set({
      configs: { ...configs, [currentStrategy]: {} },
      hasUnsavedChanges: false,
      previewResult: null,
      validationResult: null,
    });
  },

  setPreviewResult: (previewResult) => set({ previewResult }),
  setValidationResult: (validationResult) => set({ validationResult }),
  markSaved: () => set({ hasUnsavedChanges: false }),
}));
