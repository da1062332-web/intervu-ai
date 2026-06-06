import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { TokenSession } from '@/types/auth.types';

interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  hydrated: boolean;

  setSession: (session: TokenSession) => void;
  updateAccessToken: (accessToken: string, expiresAt: number) => void;
  clearSession: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      hydrated: false,

      setSession: (session) =>
        set({
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          expiresAt: session.expiresAt,
        }),

      updateAccessToken: (accessToken, expiresAt) =>
        set({
          accessToken,
          expiresAt,
        }),

      clearSession: () =>
        set({
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
        }),

      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: 'intervu-session-store',
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
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
      }),
    },
  ),
);

export const isAccessTokenExpired = (bufferMs = 15_000): boolean => {
  const { expiresAt } = useSessionStore.getState();

  if (!expiresAt) {
    return true;
  }

  return Date.now() + bufferMs >= expiresAt;
};
