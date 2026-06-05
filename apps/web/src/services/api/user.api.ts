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

  updateProfile(data: Partial<AuthUser>): Promise<AuthUser> {
    return apiClient.request<AuthUser>(`${USER_BASE_PATH}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteSession(sessionId: string): Promise<void> {
    return apiClient.request<void>(`${USER_BASE_PATH}/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  },

  deleteAllSessions(): Promise<void> {
    return apiClient.request<void>(`${USER_BASE_PATH}/sessions`, {
      method: 'DELETE',
    });
  },
};
