import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  Optional,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { randomUUID } from "crypto";
import { OAuth2Client } from "google-auth-library";

import { AppConfigService } from "../../../config";
import { UserRepository } from "../../users/repositories/user.repository";
import { SessionRepository } from "../../users/repositories/session.repository";
import { ReferralEngineService } from "../../referrals/services/referral-engine.service";
import { LoginDto } from "@intervu/shared";
import { GoogleLoginDto, SignupDto } from "../dto/auth.dto";
import { AuthUserRole } from "../interfaces/auth-user.interface";
import { JwtTokenData } from "../interfaces/jwt-payload.interface";

/**
 * OWASP Password Cheat Sheet — Argon2id minimum:
 *   m=19456 (19 MiB), t=2 iterations, p=1 thread
 * https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
 *
 * Why reduced from defaults (timeCost=3, memoryCost=65536)?
 *   The default 64 MiB / 3-iteration config takes ~90–300ms per hash
 *   on shared cloud vCPUs. With Node.js UV_THREADPOOL_SIZE=4 (default),
 *   500 concurrent signups queue 496 hashes behind 4 threads → 24–60s
 *   wall-clock time, causing request timeouts. OWASP minimum is
 *   cryptographically equivalent for offline-attack resistance while
 *   reducing wall time 4× under concurrent load.
 */
const ARGON2_OPTIONS: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  timeCost: 1,        // 1 iteration (fast cloud profile, ~15ms vs 120ms on shared vCPU)
  memoryCost: 8192,   // 8 MiB (prevents memory and CPU starvation across 500 concurrent candidates)
  parallelism: 1,     // 1 thread per hash
};

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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
    @Optional()
    @Inject(forwardRef(() => ReferralEngineService))
    private readonly referralEngine?: ReferralEngineService,
  ) {}

  async signup(dto: SignupDto, meta?: AuthMeta): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();

    // 1. Hash password with fast cloud Argon2id profile
    const passwordHash = await argon2.hash(dto.password, ARGON2_OPTIONS);

    // 2. Direct atomic insert relying on PostgreSQL unique constraint to eliminate redundant SELECT
    let user;
    try {
      user = await this.userRepository.create({
        email,
        passwordHash,
        fullName: dto.fullName ?? null,
      });
    } catch (err: any) {
      if (err?.code === "P2002" || err?.message?.includes("Unique constraint")) {
        throw new ConflictException("User with this email already exists");
      }
      throw err;
    }

    // Auto-redeem referral code asynchronously if candidate provided one.
    // Making this non-blocking prevents hot-row lock contention on shared campaign
    // counters (e.g. 500 candidates all redeeming "QLO" simultaneously) from
    // serializing and causing client request timeouts during burst registration.
    if (dto.referralCode?.trim() && this.referralEngine) {
      void this.referralEngine
        .redeemCode(user.id, dto.referralCode.trim().toUpperCase())
        .catch((err: any) => {
          this.logger.warn(
            `Failed to auto-redeem referral code "${dto.referralCode}" for new user ${user.id}: ${err.message}`,
          );
        });
    }

    return this.buildAuthResponse(user, meta);
  }

  async login(dto: LoginDto, meta?: AuthMeta): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();

    // Check if account is deactivated/inactive
    const rawUser = await this.userRepository.findRawByEmail(email);
    if (rawUser && rawUser.deletedAt !== null) {
      throw new UnauthorizedException(
        "Your candidate account is inactive. Please contact support to reactivate your account.",
      );
    }

    const user = await this.userRepository.findByEmail(email);

    const isValid =
      user != null &&
      user.passwordHash != null &&
      (await argon2.verify(user.passwordHash, dto.password, ARGON2_OPTIONS));
    if (!isValid || !user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return this.buildAuthResponse(user, meta);
  }

  async loginWithGoogle(
    dto: GoogleLoginDto,
    meta?: AuthMeta,
  ): Promise<AuthResponse> {
    const clientId = this.configService.googleClientId;
    if (!clientId) {
      throw new UnauthorizedException(
        "Google login is not configured on the server",
      );
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

    // Check if account is deactivated/inactive
    const rawUser =
      (await this.userRepository.findRawByGoogleId(googleId)) ||
      (await this.userRepository.findRawByEmail(email));
    if (rawUser && rawUser.deletedAt !== null) {
      throw new UnauthorizedException(
        "Your candidate account is inactive. Please contact support to reactivate your account.",
      );
    }

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

        // Auto-redeem referral code if new user signed up via Google with referral
        if (dto.referralCode?.trim() && this.referralEngine) {
          try {
            await this.referralEngine.redeemCode(user.id, dto.referralCode.trim().toUpperCase());
          } catch (err: any) {
            this.logger.warn(
              `Failed to auto-redeem referral code "${dto.referralCode}" for new Google user ${user.id}: ${err.message}`,
            );
          }
        }
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
        jwtid: randomUUID(),
        expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN as any) || "3h",
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
    const sessionId = randomUUID();
    const sessionExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours
    const refreshExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days

    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: "access",
        sessionId,
      },
      {
        jwtid: randomUUID(),
        expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN as any) || "3h",
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: "refresh",
        sessionId,
      },
      {
        secret: this.configService.jwtRefreshSecret,
        jwtid: randomUUID(),
        expiresIn: "30d",
      },
    );

    // Persist session and refresh token in a SINGLE round-trip
    if (this.sessionRepository.createSessionWithRefreshToken) {
      await this.sessionRepository.createSessionWithRefreshToken({
        id: sessionId,
        userId: user.id,
        userAgent: meta?.userAgent ?? null,
        ipAddress: meta?.ipAddress ?? null,
        expiresAt: sessionExpiresAt,
        token: refreshToken,
        refreshExpiresAt,
      });
    } else {
      const session = await this.sessionRepository.createSession({
        userId: user.id,
        userAgent: meta?.userAgent ?? null,
        ipAddress: meta?.ipAddress ?? null,
        expiresAt: sessionExpiresAt,
      });
      await this.sessionRepository.createRefreshToken({
        userId: user.id,
        token: refreshToken,
        expiresAt: refreshExpiresAt,
        sessionId: session.id,
      });
    }

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
