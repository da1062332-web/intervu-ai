import { z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  fullName: z.string().nullable().optional(),
  role: z.enum(["ADMIN", "CANDIDATE", "PLAN_MANAGER"]),
  createdAt: z.union([z.date(), z.string()]).optional(),
  updatedAt: z.union([z.date(), z.string()]).optional(),
});

export const CreateUserSchema = UserSchema.pick({
  email: true,
}).extend({
  password: z.string().min(8),
});

export const UpdateUserSchema = CreateUserSchema.partial();

export const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  fullName: z.string().min(1).max(100).optional(),
});

export const UserResponseSchema = UserSchema;

export const SessionSchema = z.object({
  id: z.string(),
  userAgent: z.string().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  createdAt: z.union([z.date(), z.string()]),
  expiresAt: z.union([z.date(), z.string()]),
  isCurrent: z.boolean(),
});

export const SessionListResponseSchema = z.array(SessionSchema);
