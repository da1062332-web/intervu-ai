import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
} from 'zustand/middleware';

import type {
  AuthUser,
  AuthResponseData,
} from '@/types/auth.types';

type AuthStatus =
  | 'unknown'
  | 'authenticated'
  | 'unauthenticated';

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  isLoading: boolean;
  error: string | null;

  setLoading: (
    isLoading: boolean,
  ) => void;
  setError: (
    error: string | null,
  ) => void;
  setAuthenticated: (
    user: AuthUser,
  ) => void;
  setUnauthenticated: () => void;
  applyAuthResponse: (
    payload: AuthResponseData,
  ) => void;
  clearAuthState: () => void;
}

export const useAuthStore =
  create<AuthState>()(
    persist(
      (set) => ({
        user: null,
        status: 'unknown',
        isLoading: false,
        error: null,

        setLoading: (isLoading) =>
          set({ isLoading }),

        setError: (error) =>
          set({ error }),

        setAuthenticated: (user) =>
          set({
            user,
            status:
              'authenticated',
            isLoading: false,
            error: null,
          }),

        setUnauthenticated: () =>
          set({
            user: null,
            status:
              'unauthenticated',
            isLoading: false,
          }),

        applyAuthResponse: (
          payload,
        ) =>
          set({
            user: payload.user,
            status:
              'authenticated',
            isLoading: false,
            error: null,
          }),

        clearAuthState: () =>
          set({
            user: null,
            status:
              'unauthenticated',
            isLoading: false,
            error: null,
          }),
      }),
      {
        name: 'intervu-auth-store',
        storage: createJSONStorage(
          () => localStorage,
        ),
        partialize: (state) => ({
          user: state.user,
          status: state.status,
        }),
      },
    ),
  );
