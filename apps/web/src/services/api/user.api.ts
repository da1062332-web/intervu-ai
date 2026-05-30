import { apiClient }
  from '@/services/api/client';
import type { AuthUser }
  from '@/types/auth.types';

const USER_BASE_PATH = '/auth';

export const userApi = {
  getCurrentUser():
    Promise<AuthUser> {
    return apiClient.request<AuthUser>(
      `${USER_BASE_PATH}/me`,
      {
        method: 'GET',
      },
    );
  },
};
