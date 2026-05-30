import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
} from 'zustand/middleware';

export type ThemeMode =
  | 'light'
  | 'dark'
  | 'system';

interface UIState {
  theme: ThemeMode;
  sidebarOpen: boolean;
  pendingRequests: number;
  isLoading: boolean;
  error: string | null;

  setTheme: (
    theme: ThemeMode,
  ) => void;
  toggleSidebar: () => void;
  startLoading: () => void;
  stopLoading: () => void;
  setError: (
    error: string | null,
  ) => void;
  clearError: () => void;
}

export const useUIStore =
  create<UIState>()(
    persist(
      (set) => ({
        theme: 'system',
        sidebarOpen: false,
        pendingRequests: 0,
        isLoading: false,
        error: null,

        setTheme: (theme) =>
          set({ theme }),

        toggleSidebar: () =>
          set((state) => ({
            sidebarOpen:
              !state.sidebarOpen,
          })),

        startLoading: () =>
          set((state) => {
            const pendingRequests =
              state.pendingRequests +
              1;

            return {
              pendingRequests,
              isLoading:
                pendingRequests > 0,
            };
          }),

        stopLoading: () =>
          set((state) => {
            const pendingRequests =
              Math.max(
                state.pendingRequests -
                  1,
                0,
              );

            return {
              pendingRequests,
              isLoading:
                pendingRequests > 0,
            };
          }),

        setError: (error) =>
          set({ error }),

        clearError: () =>
          set({ error: null }),
      }),
      {
        name: 'intervu-ui-store',
        storage: createJSONStorage(
          () => localStorage,
        ),
        partialize: (state) => ({
          theme: state.theme,
        }),
      },
    ),
  );
