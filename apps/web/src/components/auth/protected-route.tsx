'use client';

import { useRouter }
  from 'next/navigation';
import {
  useEffect,
  useMemo,
} from 'react';

import { Loading }
  from '@/components/ui/loading';
import { useAuthStore }
  from '@/store/auth.store';
import { useSessionStore }
  from '@/store/session.store';

export function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const hydrated =
    useSessionStore(
      (state) => state.hydrated,
    );
  const accessToken =
    useSessionStore(
      (state) =>
        state.accessToken,
    );
  const status = useAuthStore(
    (state) => state.status,
  );
  const isLoading = useAuthStore(
    (state) => state.isLoading,
  );

  const blocked = useMemo(
    () => !accessToken,
    [accessToken],
  );

  useEffect(() => {
    if (
      hydrated &&
      blocked &&
      !isLoading
    ) {
      router.replace('/login');
    }
  }, [
    blocked,
    hydrated,
    isLoading,
    router,
  ]);

  if (
    !hydrated ||
    isLoading ||
    status === 'unknown'
  ) {
    return (
      <Loading
        fullScreen
        message="Restoring your session..."
      />
    );
  }

  if (blocked) {
    return null;
  }

  return children;
}
