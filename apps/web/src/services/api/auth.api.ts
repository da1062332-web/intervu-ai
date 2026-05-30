import {
  apiClient,
  configureApiAuthHooks,
} from '@/services/api/client';
import { useAuthStore } from '@/store/auth.store';
import { useSessionStore } from '@/store/session.store';
import type {
  AuthResponseData,
  AuthUser,
  LoginRequest,
  RefreshTokenRequest,
  SignupRequest,
} from '@/types/auth.types';

const AUTH_BASE_PATH = '/auth';
const FALLBACK_ACCESS_TOKEN_TTL_MS =
  15 * 60 * 1000;

interface AuthApiPayload {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

interface RefreshApiPayload {
  accessToken: string;
  refreshToken: string;
}

function decodeTokenExpiry(
  accessToken: string,
): number {
  try {
    const payloadSegment =
      accessToken.split('.')[1];

    if (!payloadSegment) {
      return (
        Date.now() +
        FALLBACK_ACCESS_TOKEN_TTL_MS
      );
    }

    const normalized =
      payloadSegment
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const padded =
      normalized +
      '='.repeat(
        (4 -
          (normalized.length %
            4)) %
          4,
      );

    const payload = JSON.parse(
      atob(padded),
    ) as { exp?: number };

    if (
      typeof payload.exp !== 'number'
    ) {
      return (
        Date.now() +
        FALLBACK_ACCESS_TOKEN_TTL_MS
      );
    }

    return payload.exp * 1000;
  } catch {
    return (
      Date.now() +
      FALLBACK_ACCESS_TOKEN_TTL_MS
    );
  }
}

function applySessionPayload(
  payload: AuthApiPayload,
): AuthResponseData {
  const expiresAt = decodeTokenExpiry(
    payload.accessToken,
  );

  const response: AuthResponseData =
    {
      user: payload.user,
      accessToken:
        payload.accessToken,
      refreshToken:
        payload.refreshToken,
      expiresAt,
    };

  useSessionStore
    .getState()
    .setSession({
      accessToken:
        response.accessToken,
      refreshToken:
        response.refreshToken,
      expiresAt:
        response.expiresAt,
    });

  useAuthStore
    .getState()
    .applyAuthResponse(response);

  return response;
}

export function clearAuthData(): void {
  useSessionStore
    .getState()
    .clearSession();
  useAuthStore
    .getState()
    .clearAuthState();
}

export async function refreshSession(): Promise<
  string | null
> {
  const {
    refreshToken,
    setSession,
  } = useSessionStore.getState();

  if (!refreshToken) {
    clearAuthData();
    return null;
  }

  try {
    const payload =
      await apiClient.request<RefreshApiPayload>(
        `${AUTH_BASE_PATH}/refresh`,
        {
          method: 'POST',
          body: {
            refreshToken,
          } satisfies RefreshTokenRequest,
          skipAuth: true,
          skipAuthRefresh: true,
          skipErrorToast: true,
          trackLoading: false,
        },
      );

    setSession({
      accessToken:
        payload.accessToken,
      refreshToken:
        payload.refreshToken,
      expiresAt: decodeTokenExpiry(
        payload.accessToken,
      ),
    });

    const authState =
      useAuthStore.getState();
    if (authState.user) {
      authState.setAuthenticated(
        authState.user,
      );
    }

    return payload.accessToken;
  } catch {
    clearAuthData();
    return null;
  }
}

export const authApi = {
  async login(
    payload: LoginRequest,
  ): Promise<AuthResponseData> {
    useAuthStore
      .getState()
      .setLoading(true);

    try {
      const response =
        await apiClient.request<AuthApiPayload>(
          `${AUTH_BASE_PATH}/login`,
          {
            method: 'POST',
            body: payload,
            skipAuth: true,
          },
        );

      return applySessionPayload(
        response,
      );
    } finally {
      useAuthStore
        .getState()
        .setLoading(false);
    }
  },

  async signup(
    payload: SignupRequest,
  ): Promise<AuthResponseData> {
    useAuthStore
      .getState()
      .setLoading(true);

    try {
      const response =
        await apiClient.request<AuthApiPayload>(
          `${AUTH_BASE_PATH}/signup`,
          {
            method: 'POST',
            body: payload,
            skipAuth: true,
          },
        );

      return applySessionPayload(
        response,
      );
    } finally {
      useAuthStore
        .getState()
        .setLoading(false);
    }
  },

  async logout(): Promise<void> {
    const { refreshToken } =
      useSessionStore.getState();

    try {
      if (refreshToken) {
        await apiClient.request<void>(
          `${AUTH_BASE_PATH}/logout`,
          {
            method: 'POST',
            body: {
              refreshToken,
            } satisfies RefreshTokenRequest,
            skipErrorToast: true,
          },
        );
      }
    } finally {
      clearAuthData();
    }
  },
};

configureApiAuthHooks({
  getAccessToken: () =>
    useSessionStore.getState()
      .accessToken,
  refreshSession,
  onUnauthorized: clearAuthData,
});
