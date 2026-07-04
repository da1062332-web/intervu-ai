import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WizardState {
  selectedBlueprintId: Record<string, string>; // mapping configId -> blueprintId
  setBlueprintId: (configId: string, blueprintId: string) => void;
  getBlueprintId: (configId: string) => string | undefined;
}

export const useConfigWizardStore = create<WizardState>()(
  persist(
    (set, get) => ({
      selectedBlueprintId: {},
      setBlueprintId: (configId, blueprintId) =>
        set((state) => ({
          selectedBlueprintId: {
            ...state.selectedBlueprintId,
            [configId]: blueprintId,
          },
        })),
      getBlueprintId: (configId) => get().selectedBlueprintId[configId],
    }),
    {
      name: 'config-wizard-storage',
    }
  )
);
