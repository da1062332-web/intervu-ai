'use client';

import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/services/api/user.api';

export const userQueryKeys = {
  all: ['user'] as const,
  current: () => [...userQueryKeys.all, 'current'] as const,
  sessions: () => [...userQueryKeys.all, 'sessions'] as const,
} as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: userQueryKeys.current(),
    queryFn: () => userApi.getCurrentUser(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: true,
  });
}
