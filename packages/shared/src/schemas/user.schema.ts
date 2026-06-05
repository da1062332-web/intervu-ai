import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100).optional(),
  createdAt: z.date()
});

export const CreateUserSchema = UserSchema.pick({
  email: true
}).extend({
  password: z.string().min(8)
});

export const UpdateUserSchema = CreateUserSchema.partial();

export const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional()
});

export const UserResponseSchema = UserSchema;

export const SessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  ipAddress: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  lastActive: z.date(),
  createdAt: z.date(),
});

export const SessionListResponseSchema = z.array(SessionSchema);
