'use client';

import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/services/api/user.api';
import { userQueryKeys } from './use-current-user';

export function useSessions() {
  return useQuery({
    queryKey: userQueryKeys.sessions(),
    queryFn: () => userApi.getSessions(),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: true,
  });
}
