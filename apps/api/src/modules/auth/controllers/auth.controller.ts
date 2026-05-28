import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { SignupDto } from '../dto/signup.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthUser } from '../interfaces/auth-user.interface';
import { AuthService, AuthResponse } from '../services/auth.service';

interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new candidate account' })
  @ApiBody({ type: SignupDto })
  @ApiOkResponse({ description: 'User registered successfully' })
  async signup(
    @Body() dto: SignupDto,
    @Req()
    req: { ip?: string; headers: Record<string, string | string[] | undefined> },
  ): Promise<AuthResponse> {
    return this.authService.signup(dto, this.getMeta(req));
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'User logged in successfully' })
  async login(
    @Body() dto: LoginDto,
    @Req()
    req: { ip?: string; headers: Record<string, string | string[] | undefined> },
  ): Promise<AuthResponse> {
    return this.authService.login(dto, this.getMeta(req));
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({ description: 'Tokens refreshed successfully' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req()
    req: { ip?: string; headers: Record<string, string | string[] | undefined> },
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.refresh(dto.refreshToken, this.getMeta(req));
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt-auth')
  @ApiOperation({ summary: 'Get currently authenticated user profile' })
  @ApiOkResponse({ description: 'Current authenticated user' })
  getMe(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }

  private getMeta(req: {
    ip?: string;
    headers: Record<string, string | string[] | undefined>;
  }): RequestMeta {
    const userAgent = req.headers['user-agent'];
    return {
      ipAddress: req.ip,
      userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
    };
  }
}
