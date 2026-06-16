import { useAuthStore } from '@/store/auth.store';
import { useSessionStore } from '@/store/session.store';
import { isAccessTokenExpired } from '@/store/session.store';
import { useMemo } from 'react';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const hydrated = useSessionStore((state) => state.hydrated);
  const accessToken = useSessionStore((state) => state.accessToken);
  
  const isAuthenticated = useMemo(() => {
    return hydrated && !!accessToken && status === 'authenticated' && !isAccessTokenExpired();
  }, [hydrated, accessToken, status]);

  return {
    user,
    role: user?.role,
    isAuthenticated,
    isHydrated: hydrated,
    isLoading: useAuthStore((state) => state.isLoading) || !hydrated
  };
}
