'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';

import { Loading } from '@/components/ui/loading';
import { useAuthStore } from '@/store/auth.store';
import { useSessionStore } from '@/store/session.store';

export function ProtectedRoute({ 
  children,
  allowedRoles 
}: { 
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const router = useRouter();
  const hydrated = useSessionStore((state) => state.hydrated);
  const accessToken = useSessionStore((state) => state.accessToken);
  const status = useAuthStore((state) => state.status);
  const isLoading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);

  const blocked = useMemo(() => !accessToken, [accessToken]);

  useEffect(() => {
    if (hydrated && blocked && !isLoading) {
      router.replace('/login');
    } else if (hydrated && !blocked && !isLoading && status === 'authenticated') {
      if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        router.replace('/403');
      }
    }
  }, [blocked, hydrated, isLoading, router, allowedRoles, user, status]);

  if (!hydrated || isLoading || status === 'unknown') {
    return <Loading fullScreen message='Restoring your session...' />;
  }

  if (blocked) {
    return null;
  }

  return children;
}
