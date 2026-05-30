'use client';

import type { ReactNode } from 'react';
import { useQueryClient }
  from '@tanstack/react-query';
import {
  useEffect,
  useState,
} from 'react';

import { userApi }
  from '@/services/api/user.api';
import { clearAuthData }
  from '@/services/api/auth.api';
import { useAuthStore }
  from '@/store/auth.store';
import { useSessionStore }
  from '@/store/session.store';

export function SessionHydrator({
  children,
}: {
  children: ReactNode;
}) {
  const [ready, setReady] =
    useState(false);
  const queryClient =
    useQueryClient();

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      await Promise.all([
        useSessionStore.persist
          .rehydrate(),
        useAuthStore.persist
          .rehydrate(),
      ]);

      if (cancelled) {
        return;
      }

      const sessionStoreState =
        useSessionStore.getState();
      const authStoreState =
        useAuthStore.getState();

      sessionStoreState.setHydrated(
        true,
      );

      if (
        !sessionStoreState.accessToken
      ) {
        authStoreState.setUnauthenticated();
        setReady(true);
        return;
      }

      authStoreState.setLoading(true);

      try {
        const user =
          await userApi.getCurrentUser();
        authStoreState.setAuthenticated(
          user,
        );
      } catch {
        clearAuthData();
        queryClient.clear();
      } finally {
        authStoreState.setLoading(
          false,
        );
        setReady(true);
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  if (!ready) {
    return null;
  }

  return children;
}
