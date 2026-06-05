'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/services/api/user.api';
import { userQueryKeys } from './use-current-user';
import type { UserSession } from '@/types/auth.types';

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.deleteSession,
    onMutate: async (sessionId) => {
      await queryClient.cancelQueries({ queryKey: userQueryKeys.sessions() });

      const previousSessions = queryClient.getQueryData<UserSession[]>(userQueryKeys.sessions());

      if (previousSessions) {
        queryClient.setQueryData<UserSession[]>(
          userQueryKeys.sessions(),
          previousSessions.filter((s) => s.id !== sessionId),
        );
      }

      return { previousSessions };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousSessions) {
        queryClient.setQueryData(userQueryKeys.sessions(), context.previousSessions);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.sessions() });
    },
  });
}

export function useDeleteAllSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.deleteAllSessions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.sessions() });
    },
  });
}
