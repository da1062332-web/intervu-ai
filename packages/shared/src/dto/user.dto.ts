import { z } from 'zod';
import {
  UserSchema,
  CreateUserSchema,
  UpdateUserSchema,
  UserResponseSchema,
  UpdateProfileSchema
} from '../schemas/user.schema';

export type UserDto = z.infer<typeof UserSchema>;
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type UserResponseDto = z.infer<typeof UserResponseSchema>;
export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
