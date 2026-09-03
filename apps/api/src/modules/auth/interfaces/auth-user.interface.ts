export type AuthUserRole = "CANDIDATE" | "ADMIN" | "PLAN_MANAGER";

export interface AuthUser {
  id: string;
  email: string;
  role: AuthUserRole;
  sessionId?: string;
}
