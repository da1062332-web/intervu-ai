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
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (hydrated && accessToken && status === 'authenticated' && user) {
      if (user.role === 'CANDIDATE') {
        router.replace('/candidate/dashboard');
      } else {
        router.replace('/admin/dashboard');
      }
    }
  }, [accessToken, hydrated, router, status, user]);

  if (!hydrated) {
    return <Loading fullScreen message='Restoring your session...' />;
  }

  if (accessToken && status === 'authenticated') {
    return null;
  }

  return children;
}
