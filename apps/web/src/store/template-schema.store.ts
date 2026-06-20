import { create } from 'zustand';
import { VariableType, RuleType } from '@intervu/shared/enums';

export interface TemplateVariable {
  id: string;
  templateId: string;
  variableName: string;
  variableType: VariableType;
  required: boolean;
  defaultValue?: string | null;
}

export interface TemplateRule {
  id: string;
  templateId: string;
  ruleType: RuleType;
  ruleConfig: Record<string, unknown>;
}

interface TemplateSchemaState {
  variables: TemplateVariable[];
  rules: TemplateRule[];
  preview: string;
  validationErrors: string[];
  selectedVariable: TemplateVariable | null;
  selectedRule: TemplateRule | null;
  isDirty: boolean;
  isLoading: boolean;

  setVariables: (variables: TemplateVariable[]) => void;
  setRules: (rules: TemplateRule[]) => void;
  setSelectedVariable: (variable: TemplateVariable | null) => void;
  setSelectedRule: (rule: TemplateRule | null) => void;
  setValidationErrors: (errors: string[]) => void;
  setDirty: (isDirty: boolean) => void;
  setLoading: (isLoading: boolean) => void;

  refreshPreview: () => void;
  resetStore: () => void;
}

const initialState = {
  variables: [],
  rules: [],
  preview: '',
  validationErrors: [],
  selectedVariable: null,
  selectedRule: null,
  isDirty: false,
  isLoading: false,
};

export const useTemplateSchemaStore = create<TemplateSchemaState>((set, get) => ({
  ...initialState,

  setVariables: (variables) => {
    set({ variables, isLoading: false });
    get().refreshPreview();
  },

  setRules: (rules) => {
    set({ rules, isLoading: false });
    get().refreshPreview();
  },

  setSelectedVariable: (selectedVariable) => set({ selectedVariable }),
  setSelectedRule: (selectedRule) => set({ selectedRule }),
  setValidationErrors: (validationErrors) => {
    set({ validationErrors });
    get().refreshPreview();
  },
  setDirty: (isDirty) => set({ isDirty }),
  setLoading: (isLoading) => set({ isLoading }),

  refreshPreview: () => {
    const { variables, rules, validationErrors } = get();
    const previewObj = {
      version: 1,
      variables: variables.map(({ variableName, variableType, required, defaultValue }) => ({
        name: variableName,
        type: variableType,
        required,
        defaultValue: defaultValue || null,
      })),
      rules: rules.map(({ ruleType, ruleConfig }) => ({
        type: ruleType,
        config: ruleConfig,
      })),
      valid: validationErrors.length === 0,
    };
    set({ preview: JSON.stringify(previewObj, null, 2) });
  },

  resetStore: () => set(initialState),
}));
