'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';

import { Loading } from '@/components/ui/loading';
import { useAuthStore } from '@/store/auth.store';
import { useSessionStore } from '@/store/session.store';

export function ProtectedRoute({
  children,
  allowedRoles,
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
  const roleDenied = useMemo(() => {
    return !!(allowedRoles && user && !allowedRoles.includes(user.role));
  }, [allowedRoles, user]);

  useEffect(() => {
    if (hydrated && blocked && !isLoading) {
      router.replace('/login');
    } else if (hydrated && !blocked && !isLoading && status === 'authenticated') {
      if (roleDenied) {
        // Redirect based on user's actual role
        if (user?.role === 'CANDIDATE') {
          router.replace('/candidate/dashboard');
        } else if (user?.role === 'ADMIN') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/403');
        }
      }
    }
  }, [blocked, hydrated, isLoading, router, roleDenied, user, status]);

  if (!hydrated || isLoading || status === 'unknown') {
    return <Loading fullScreen message='Restoring your session...' />;
  }

  if (blocked || roleDenied) {
    return null;
  }

  return children;
}
