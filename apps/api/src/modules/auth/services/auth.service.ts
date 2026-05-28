import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';

import { AppConfigService } from '../../../config';
import { PrismaService } from '../../../prisma/prisma.service';
import { LoginDto } from '../dto/login.dto';
import { SignupDto } from '../dto/signup.dto';
import { AuthUserRole } from '../interfaces/auth-user.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

interface AuthMeta {
  userAgent?: string;
  ipAddress?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    role: AuthUserRole;
  };
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
  ) {}

  async signup(dto: SignupDto, meta?: AuthMeta): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: await argon2.hash(dto.password),
        fullName: dto.fullName ?? null,
      },
    });

    return this.buildAuthResponse(user, meta);
  }

  async login(dto: LoginDto, meta?: AuthMeta): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    const isValid =
      user != null && (await argon2.verify(user.passwordHash, dto.password));
    if (!isValid || !user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(user, meta);
  }

  async refresh(
    refreshToken: string,
    meta?: AuthMeta,
  ): Promise<Pick<AuthResponse, 'accessToken' | 'refreshToken'>> {
    const payload = this.verifyRefreshToken(refreshToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      select: { revoked: true, expiresAt: true },
    });

    if (!stored || stored.revoked || stored.expiresAt <= new Date()) {
      throw new UnauthorizedException('Refresh token is not active');
    }

    await this.prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { revoked: true },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.issueTokens(user, meta);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private async buildAuthResponse(
    user: {
      id: string;
      email: string;
      fullName: string | null;
      role: AuthUserRole;
    },
    meta?: AuthMeta,
  ): Promise<AuthResponse> {
    const tokens = await this.issueTokens(user, meta);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private async issueTokens(
    user: { id: string; email: string; role: AuthUserRole },
    meta?: AuthMeta,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'access',
      },
      {
        jwtid: randomUUID(),
        expiresIn: '15m',
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'refresh',
      },
      {
        secret: this.configService.jwtRefreshSecret,
        jwtid: randomUUID(),
        expiresIn: '30d',
      },
    );

    await this.prisma.session.create({
      data: {
        userId: user.id,
        userAgent: meta?.userAgent ?? null,
        ipAddress: meta?.ipAddress ?? null,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
    });

    return { accessToken, refreshToken };
  }

  private verifyRefreshToken(token: string): JwtPayload {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.jwtRefreshSecret,
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token type');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
