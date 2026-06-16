import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100).optional(),
  role: z.enum(["ADMIN", "CANDIDATE"]),
  createdAt: z.union([z.date(), z.string()]),
});

export const CreateUserSchema = UserSchema.pick({
  email: true,
}).extend({
  password: z.string().min(8),
});

export const UpdateUserSchema = CreateUserSchema.partial();

export const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export const UserResponseSchema = UserSchema;

export const SessionSchema = z.object({
  id: z.string().cuid(),
  userAgent: z.string().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  createdAt: z.union([z.date(), z.string()]),
  expiresAt: z.union([z.date(), z.string()]),
  isCurrent: z.boolean(),
});

export const SessionListResponseSchema = z.array(SessionSchema);
