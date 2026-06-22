import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface DashboardState {
  acceptedInstructions: Record<string, boolean>;

  acceptInstructions: (testId: string, accepted: boolean) => void;
  resetInstructions: (testId: string) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      acceptedInstructions: {},

      acceptInstructions: (testId, accepted) =>
        set((state) => ({
          acceptedInstructions: {
            ...state.acceptedInstructions,
            [testId]: accepted,
          },
        })),

      resetInstructions: (testId) =>
        set((state) => {
          const updated = { ...state.acceptedInstructions };
          delete updated[testId];
          return { acceptedInstructions: updated };
        }),
    }),
    {
      name: 'instructionAccepted', // Use key 'instructionAccepted' to persist instructionAccepted state in localStorage
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      skipHydration: true,
    }
  )
);
