import { AuthUserRole } from './auth-user.interface';

export type TokenType = 'access' | 'refresh';

export interface JwtTokenData {
  sub: string;
  email: string;
  role: AuthUserRole;
  type: TokenType;
  iat: number;
  exp: number;
  jti: string;
  sessionId?: string;
}
