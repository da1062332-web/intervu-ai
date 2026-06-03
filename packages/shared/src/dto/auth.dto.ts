import { z } from 'zod';
import { AuthLoginSchema, AuthSignupSchema, RefreshTokenSchema } from '../schemas/auth.schema';

export type LoginDto = z.infer<typeof AuthLoginSchema>;
export type SignupDto = z.infer<typeof AuthSignupSchema>;
export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;
