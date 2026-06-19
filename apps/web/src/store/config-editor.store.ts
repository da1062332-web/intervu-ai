import { create } from 'zustand';

interface ConfigEditorState {
  selectedConfigId: string | null;
  selectedSectionId: string | null;
  isDirty: boolean;

  setSelectedConfigId: (id: string | null) => void;
  setSelectedSectionId: (id: string | null) => void;
  setDirty: (isDirty: boolean) => void;
  resetStore: () => void;
}

const initialState = {
  selectedConfigId: null,
  selectedSectionId: null,
  isDirty: false,
};

export const useConfigEditorStore = create<ConfigEditorState>((set) => ({
  ...initialState,

  setSelectedConfigId: (id) => set({ selectedConfigId: id }),
  setSelectedSectionId: (id) => set({ selectedSectionId: id }),
  setDirty: (isDirty) => set({ isDirty }),
  resetStore: () => set(initialState),
}));
