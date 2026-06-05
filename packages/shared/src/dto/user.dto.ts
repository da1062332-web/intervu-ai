import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
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

export class UpdateProfileDto {
  @ApiProperty({ example: 'John Doe', required: false, description: 'User full name update' })
  name?: string;

  static validate(data: unknown): z.SafeParseReturnType<unknown, UpdateProfileDto> {
    return UpdateProfileSchema.safeParse(data) as unknown as z.SafeParseReturnType<unknown, UpdateProfileDto>;
  }
}
