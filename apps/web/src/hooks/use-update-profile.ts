'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/services/api/user.api';
import { userQueryKeys } from './use-current-user';

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.current() });
    },
  });
}
