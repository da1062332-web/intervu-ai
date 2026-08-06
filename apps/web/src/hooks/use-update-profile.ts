'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/services/api/user.api';
import { userQueryKeys } from './use-current-user';

import { useAuthStore } from '@/store/auth.store';
import { AuthUser } from '@/types/auth.types';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  return useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (updatedUser, variables) => {
      // Optimistically update React Query cache
      const updatedName = variables.name;
      queryClient.setQueryData(userQueryKeys.current(), (oldData: AuthUser | undefined) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          ...updatedUser,
          name: updatedName ?? oldData.name,
          fullName: updatedName ?? oldData.fullName, // Ensure both fields are updated immediately
        };
      });

      queryClient.invalidateQueries({ queryKey: userQueryKeys.current() });

      // Optimistically update Zustand store
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        setAuthenticated({
          ...currentUser,
          ...updatedUser,
          name: updatedName ?? currentUser.name,
          fullName: updatedName ?? currentUser.fullName,
        } as AuthUser);
      }
    },
  });
}
