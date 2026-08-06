import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { randomUUID } from "crypto";
import { OAuth2Client } from "google-auth-library";

import { AppConfigService } from "../../../config";
import { UserRepository } from "../../users/repositories/user.repository";
import { SessionRepository } from "../../users/repositories/session.repository";
import { LoginDto, SignupDto } from "@intervu/shared";
import { GoogleLoginDto } from "../dto/auth.dto";
import { AuthUserRole } from "../interfaces/auth-user.interface";
import { JwtTokenData } from "../interfaces/jwt-payload.interface";

interface AuthMeta {
  userAgent?: string;
  ipAddress?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    name?: string | null;
    role: AuthUserRole;
  };
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
  ) {}

  async signup(dto: SignupDto, meta?: AuthMeta): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    const user = await this.userRepository.create({
      email,
      passwordHash: await argon2.hash(dto.password),
      fullName: dto.fullName ?? null,
    });

    return this.buildAuthResponse(user, meta);
  }

  async login(dto: LoginDto, meta?: AuthMeta): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(email);

    const isValid =
      user != null &&
      user.passwordHash != null &&
      (await argon2.verify(user.passwordHash, dto.password));
    if (!isValid || !user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return this.buildAuthResponse(user, meta);
  }

  async loginWithGoogle(dto: GoogleLoginDto, meta?: AuthMeta): Promise<AuthResponse> {
    const clientId = this.configService.googleClientId;
    if (!clientId) {
      throw new UnauthorizedException("Google login is not configured on the server");
    }

    const client = new OAuth2Client(clientId);
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: dto.idToken,
        audience: clientId,
      });
    } catch {
      throw new UnauthorizedException("Invalid Google ID Token");
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new UnauthorizedException("Invalid Google token payload");
    }

    const email = payload.email.trim().toLowerCase();
    const googleId = payload.sub;
    const fullName = payload.name ?? null;

    // 1. Search by googleId
    let user = await this.userRepository.findByGoogleId(googleId);

    if (!user) {
      // 2. Search by email
      user = await this.userRepository.findByEmail(email);

      if (user) {
        // Link googleId to existing user
        user = await this.userRepository.update(user.id, {
          googleId,
        } as any);
      } else {
        // 3. Register a new user
        user = await this.userRepository.create({
          email,
          googleId,
          passwordHash: null as any,
          fullName,
          role: "CANDIDATE",
        });
      }
    }

    return this.buildAuthResponse(user, meta);
  }

  async refresh(
    refreshToken: string,
    meta?: AuthMeta,
  ): Promise<Pick<AuthResponse, "accessToken" | "refreshToken">> {
    const payload = this.verifyRefreshToken(refreshToken);

    const stored = await this.sessionRepository.findRefreshToken(refreshToken);

    if (!stored || stored.revoked || stored.expiresAt <= new Date()) {
      throw new UnauthorizedException("Refresh token is not active");
    }

    // Extend the session expiry to keep it alive
    if (stored.sessionId) {
      await this.sessionRepository.update(stored.sessionId, {
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // Extend session by 7 days
      });
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Issue a new access token for the same session
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: "access",
        sessionId: stored.sessionId,
      },
      {
        jwtid: require("crypto").randomUUID(),
        expiresIn: "15m",
      },
    );

    return {
      accessToken,
      refreshToken, // Reuse the same refresh token
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const stored = await this.sessionRepository.findRefreshToken(refreshToken);

    if (!stored || stored.revoked) {
      return;
    }

    await this.sessionRepository.revokeRefreshToken(refreshToken);

    if (stored.sessionId) {
      try {
        await this.sessionRepository.delete(stored.sessionId);
      } catch {
        // Ignore if already deleted
      }
    }
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
        name: user.fullName,
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
    // 1. Create a session first to generate its ID
    const session = await this.sessionRepository.createSession({
      userId: user.id,
      userAgent: meta?.userAgent ?? null,
      ipAddress: meta?.ipAddress ?? null,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
    });

    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: "access",
        sessionId: session.id,
      },
      {
        jwtid: randomUUID(),
        expiresIn: "15m",
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: "refresh",
        sessionId: session.id,
      },
      {
        secret: this.configService.jwtRefreshSecret,
        jwtid: randomUUID(),
        expiresIn: "30d",
      },
    );

    // 2. Persist the refresh token, linked to the session
    await this.sessionRepository.createRefreshToken({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
      sessionId: session.id,
    });

    return { accessToken, refreshToken };
  }

  private verifyRefreshToken(token: string): JwtTokenData {
    try {
      const payload = this.jwtService.verify<JwtTokenData>(token, {
        secret: this.configService.jwtRefreshSecret,
      });

      if (payload.type !== "refresh") {
        throw new UnauthorizedException("Invalid refresh token type");
      }

      return payload;
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }
}
