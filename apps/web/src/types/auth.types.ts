export type UserRole = 'CANDIDATE' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string | null;
  name?: string | null;
  role: UserRole;
  createdAt?: string;
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

export interface AuthResponseData extends TokenSession {
  user: AuthUser;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UserSession {
  id: string;
  userId: string;
  device?: string;
  userAgent?: string;
  ip?: string;
  lastActiveAt?: string;
  createdAt?: string;
  expiresAt?: string;
  isCurrent?: boolean;
}
