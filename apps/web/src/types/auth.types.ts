export type UserRole =
  | 'CANDIDATE'
  | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string | null;
  role: UserRole;
}

export interface TokenSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  fullName?: string;
}

export interface AuthResponseData
  extends TokenSession {
  user: AuthUser;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
