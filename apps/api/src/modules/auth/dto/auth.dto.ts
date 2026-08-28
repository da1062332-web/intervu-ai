import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { z } from "zod";
import {
  AuthLoginSchema,
  AuthSignupSchema,
  RefreshTokenSchema,
  GoogleLoginSchema,
} from "@intervu/shared";

export class SignupDto {
  @ApiProperty({
    example: "candidate@skillitrix.com",
    description: "Candidate email address for registration",
  })
  email!: string;

  @ApiProperty({
    example: "SkillitriX123!",
    description: "Secure account password (minimum 8 characters)",
  })
  password!: string;

  @ApiPropertyOptional({
    example: "John Doe",
    description: "Optional full name of the candidate",
  })
  fullName?: string;

  static validate(data: unknown): z.SafeParseReturnType<unknown, SignupDto> {
    return AuthSignupSchema.safeParse(data) as unknown as z.SafeParseReturnType<
      unknown,
      SignupDto
    >;
  }
}

export class LoginDto {
  @ApiProperty({
    example: "candidate@skillitrix.com",
    description: "Registered email address",
  })
  email!: string;

  @ApiProperty({
    example: "SkillitriX123!",
    description: "Account password",
  })
  password!: string;

  static validate(data: unknown): z.SafeParseReturnType<unknown, LoginDto> {
    return AuthLoginSchema.safeParse(data) as unknown as z.SafeParseReturnType<
      unknown,
      LoginDto
    >;
  }
}

export class RefreshTokenDto {
  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "Active refresh token to generate new credentials",
  })
  refreshToken!: string;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, RefreshTokenDto> {
    return RefreshTokenSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, RefreshTokenDto>;
  }
}

export class GoogleLoginDto {
  @ApiProperty({
    example: "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
    description: "Google OAuth2 ID Token received from client side",
  })
  idToken!: string;

  static validate(
    data: unknown,
  ): z.SafeParseReturnType<unknown, GoogleLoginDto> {
    return GoogleLoginSchema.safeParse(
      data,
    ) as unknown as z.SafeParseReturnType<unknown, GoogleLoginDto>;
  }
}
