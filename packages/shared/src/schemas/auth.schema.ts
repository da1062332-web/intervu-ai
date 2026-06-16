import { z } from "zod";

export const AuthLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const AuthSignupSchema = AuthLoginSchema.extend({
  fullName: z.string().optional(),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  role: z.enum(["ADMIN", "CANDIDATE"]),
  sessionId: z.string().optional(),
});

export const TokensResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const AuthResponseSchema = z.object({
  user: AuthUserSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});
