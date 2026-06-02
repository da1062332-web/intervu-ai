'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

import { useLayoutStore } from '@/store/layout.store';
import { useSessionStore } from '@/store/session.store';
import { useAuthStore } from '@/store/auth.store';

/**
 * HydrationProvider ensures Zustand persisted stores are fully rehydrated
 * on the client before rendering children.
 *
 * This prevents SSR/CSR mismatch for persisted state (sidebar collapse, etc.)
 * It complements SessionHydrator which handles auth state rehydration.
 */
export function HydrationProvider({ children }: { children: ReactNode }) {
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    // Trigger manual rehydration for all persisted stores
    // (Zustand persist auto-rehydrates on mount, but we ensure ordering)
    void Promise.all([
      useLayoutStore.persist.rehydrate(),
      useSessionStore.persist.rehydrate(),
      useAuthStore.persist.rehydrate(),
    ]);
  }, []);

  return <>{children}</>;
}
