import { create } from 'zustand';

interface DifficultyDistributionState {
  easyPercentage: number;
  mediumPercentage: number;
  hardPercentage: number;
}

interface RuleFlagsState {
  negativeMarkingEnabled: boolean;
  sectionalCutoffEnabled: boolean;
  adaptiveDifficultyEnabled: boolean;
  shuffleQuestionsEnabled: boolean;
  shuffleOptionsEnabled: boolean;
  allowSectionNavigation: boolean;
}

interface ConfigRulesState {
  distribution: DifficultyDistributionState | null;
  rules: RuleFlagsState | null;
  isDirty: boolean;

  setDistribution: (dist: DifficultyDistributionState | null) => void;
  setRules: (rules: RuleFlagsState | null) => void;
  setDirty: (isDirty: boolean) => void;
  resetStore: () => void;
}

const initialState = {
  distribution: null,
  rules: null,
  isDirty: false,
};

export const useConfigRulesStore = create<ConfigRulesState>((set) => ({
  ...initialState,

  setDistribution: (distribution) => set({ distribution, isDirty: true }),
  setRules: (rules) => set({ rules, isDirty: true }),
  setDirty: (isDirty) => set({ isDirty }),
  resetStore: () => set(initialState),
}));
