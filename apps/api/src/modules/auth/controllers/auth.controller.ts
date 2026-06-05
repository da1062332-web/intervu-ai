import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import {
  ValidateResponse,
  AuthResponseSchema,
  TokensResponseSchema,
  AuthUserSchema,
} from "@intervu/shared";

// eslint-disable-next-line no-restricted-imports
import { LoginDto, RefreshTokenDto, SignupDto } from "../dto/auth.dto";
import { CurrentUser } from "../decorators/current-user.decorator";
import { Public } from "../decorators/public.decorator";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { AuthUser } from "../interfaces/auth-user.interface";
import { AuthService, AuthResponse } from "../services/auth.service";

interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

@ApiTags("auth")
@Controller("auth")
@ApiBearerAuth("jwt-auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("signup")
  @ValidateResponse(AuthResponseSchema)
  @ApiOperation({ summary: "Register a new candidate account" })
  @ApiBody({ type: SignupDto, description: "Signup credentials" })
  @ApiOkResponse({ description: "User registered successfully" })
  async signup(
    @Body() dto: SignupDto,
    @Req()
    req: {
      ip?: string;
      headers: Record<string, string | string[] | undefined>;
    },
  ): Promise<AuthResponse> {
    return this.authService.signup(dto, this.getMeta(req));
  }

  @Public()
  @Post("login")
  @ValidateResponse(AuthResponseSchema)
  @ApiOperation({ summary: "Login with email and password" })
  @ApiBody({ type: LoginDto, description: "Login credentials" })
  @ApiOkResponse({ description: "User logged in successfully" })
  async login(
    @Body() dto: LoginDto,
    @Req()
    req: {
      ip?: string;
      headers: Record<string, string | string[] | undefined>;
    },
  ): Promise<AuthResponse> {
    return this.authService.login(dto, this.getMeta(req));
  }

  @Public()
  @Post("refresh")
  @ValidateResponse(TokensResponseSchema)
  @ApiOperation({ summary: "Refresh access token using refresh token" })
  @ApiBody({ type: RefreshTokenDto, description: "Refresh token" })
  @ApiOkResponse({ description: "Tokens refreshed successfully" })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req()
    req: {
      ip?: string;
      headers: Record<string, string | string[] | undefined>;
    },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.refresh(dto.refreshToken, this.getMeta(req));
  }

  @Public()
  @Post("logout")
  @ApiOperation({ summary: "Logout and revoke refresh token" })
  @ApiBody({ type: RefreshTokenDto, description: "Refresh token to revoke" })
  @ApiOkResponse({ description: "User logged out successfully" })
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.authService.logout(dto.refreshToken);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("jwt-auth")
  @ValidateResponse(AuthUserSchema)
  @ApiOperation({ summary: "Get currently authenticated user profile" })
  @ApiOkResponse({ description: "Current authenticated user" })
  getMe(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  private getMeta(req: {
    ip?: string;
    headers: Record<string, string | string[] | undefined>;
  }): RequestMeta {
    const userAgent = req.headers["user-agent"];
    return {
      ipAddress: req.ip,
      userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
    };
  }
}
