import { apiClient } from '@/services/api/client';
import type { AuthUser, UserSession } from '@/types/auth.types';

const USER_BASE_PATH = '/users';

export const userApi = {
  getCurrentUser(): Promise<AuthUser> {
    return apiClient.request<AuthUser>(`${USER_BASE_PATH}/me`, {
      method: 'GET',
    });
  },

  getSessions(): Promise<UserSession[]> {
    return apiClient.request<UserSession[]>(`${USER_BASE_PATH}/sessions`, {
      method: 'GET',
    });
  },
};
