import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { AuthLoginSchema, AuthSignupSchema, RefreshTokenSchema } from '../schemas/auth.schema';

export class LoginDto {
  @ApiProperty({ example: 'candidate@intervu.ai', description: 'User login email address' })
  email!: string;

  @ApiProperty({ example: 'Intervu123!', description: 'User login password' })
  password!: string;

  static validate(data: unknown): z.SafeParseReturnType<unknown, LoginDto> {
    return AuthLoginSchema.safeParse(data) as unknown as z.SafeParseReturnType<unknown, LoginDto>;
  }
}

export class SignupDto {
  @ApiProperty({ example: 'candidate@intervu.ai', description: 'User registration email' })
  email!: string;

  @ApiProperty({ example: 'Intervu123!', description: 'User password (min 8 characters)' })
  password!: string;

  @ApiProperty({ example: 'John Doe', required: false, description: 'Optional user full name' })
  fullName?: string;

  static validate(data: unknown): z.SafeParseReturnType<unknown, SignupDto> {
    return AuthSignupSchema.safeParse(data) as unknown as z.SafeParseReturnType<unknown, SignupDto>;
  }
}

export class RefreshTokenDto {
  @ApiProperty({ example: 'jwt_refresh_token_string_here', description: 'Active JWT refresh token' })
  refreshToken!: string;

  static validate(data: unknown): z.SafeParseReturnType<unknown, RefreshTokenDto> {
    return RefreshTokenSchema.safeParse(data) as unknown as z.SafeParseReturnType<unknown, RefreshTokenDto>;
  }
}
