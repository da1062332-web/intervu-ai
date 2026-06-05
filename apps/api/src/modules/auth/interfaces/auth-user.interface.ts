export type AuthUserRole = "CANDIDATE" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  role: AuthUserRole;
  sessionId?: string;
}
