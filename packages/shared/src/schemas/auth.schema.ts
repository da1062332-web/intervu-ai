import { z } from 'zod';

export const AuthLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const AuthSignupSchema = AuthLoginSchema.extend({
  fullName: z.string().optional()
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1)
});
