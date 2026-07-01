'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/services/api/user.api';
import { userQueryKeys } from './use-current-user';
import { notifySuccess, notifyApiError } from '@/services/notifications/toast';

export function useManageSessions() {
  const queryClient = useQueryClient();

  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: string) => userApi.deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.sessions() });
      notifySuccess('Session successfully logged out.');
    },
    onError: (error) => {
      notifyApiError(error, 'Failed to revoke session. Please try again.');
    },
  });

  const deleteAllSessionsMutation = useMutation({
    mutationFn: () => userApi.deleteAllSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.sessions() });
      notifySuccess('You have been signed out from all other devices.');
    },
    onError: (error) => {
      notifyApiError(error, 'Failed to logout other devices. Please try again.');
    },
  });

  return {
    deleteSession: deleteSessionMutation.mutate,
    isDeleting: deleteSessionMutation.isPending,
    deleteAllSessions: deleteAllSessionsMutation.mutate,
    isDeletingAll: deleteAllSessionsMutation.isPending,
  };
}
