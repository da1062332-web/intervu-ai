'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { Loading } from '@/components/ui/loading';
import { useAuthStore } from '@/store/auth.store';
import { useSessionStore } from '@/store/session.store';

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useSessionStore((state) => state.hydrated);
  const accessToken = useSessionStore((state) => state.accessToken);
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (hydrated && accessToken && status === 'authenticated') {
      router.replace('/dashboard');
    }
  }, [accessToken, hydrated, router, status]);

  if (!hydrated) {
    return <Loading fullScreen message='Restoring your session...' />;
  }

  if (accessToken && status === 'authenticated') {
    return null;
  }

  return children;
}
