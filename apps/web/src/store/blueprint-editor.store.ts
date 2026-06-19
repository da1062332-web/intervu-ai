import { create } from 'zustand';

interface ValidationState {
  isValid: boolean;
  errors: string[];
}

interface BlueprintEditorState {
  selectedBlueprintId: string | null;
  validationState: ValidationState;
  isDirty: boolean;

  setSelectedBlueprint: (id: string | null) => void;
  setValidationState: (state: ValidationState) => void;
  setDirtyState: (isDirty: boolean) => void;
  reset: () => void;
}

const initialState = {
  selectedBlueprintId: null,
  validationState: {
    isValid: true,
    errors: [],
  },
  isDirty: false,
};

export const useBlueprintEditorStore = create<BlueprintEditorState>()((set) => ({
  ...initialState,

  setSelectedBlueprint: (id) =>
    set(() => ({
      selectedBlueprintId: id,
    })),

  setValidationState: (state) =>
    set(() => ({
      validationState: state,
    })),

  setDirtyState: (isDirty) =>
    set(() => ({
      isDirty,
    })),

  reset: () =>
    set(() => ({
      ...initialState,
    })),
}));
