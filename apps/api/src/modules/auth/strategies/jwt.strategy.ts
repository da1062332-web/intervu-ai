import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import { AppConfigService } from "../../../config";
import { RedisConnectionManager } from "../../../cache/redis-connection.manager";
import { UserRepository } from "../../users/repositories/user.repository";
import { AuthUser } from "../interfaces/auth-user.interface";
import { JwtTokenData } from "../interfaces/jwt-payload.interface";

const AUTH_USER_CACHE_KEY = (userId: string) => `auth:user_cache:${userId}`;
const AUTH_USER_CACHE_FRESH_MS = 30_000; // Trust the cache without hitting the DB for this long
const AUTH_USER_CACHE_TTL_SECONDS = 300; // Keep a stale copy around longer, as an outage fallback

interface CachedAuthUser {
  id: string;
  email: string;
  role: AuthUser["role"];
  cachedAt: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: AppConfigService,
    private readonly userRepository: UserRepository,
  ) {
    const secret =
      configService?.jwtSecret ||
      process.env.JWT_SECRET ||
      (process.env.NODE_ENV !== "production"
        ? "dev_jwt_secret_must_be_at_least_32_chars_long_key_12345"
        : undefined);

    if (!secret) {
      throw new Error(
        "CRITICAL SECURITY CONFIG ERROR: JWT_SECRET environment variable is missing in production!",
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter("token"),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtTokenData): Promise<AuthUser> {
    if (payload.type !== "access") {
      throw new UnauthorizedException("Invalid token type");
    }

    // Fast-path: The access token has already been cryptographically verified by Passport
    // using JWT_SECRET. Its payload contains trusted sub (userId), email, and role.
    // Serving these directly avoids redundant database queries on every authenticated
    // request (such as GET /auth/me during high-concurrency bursts), dropping latency to <1ms.
    if (payload.sub && payload.email && payload.role) {
      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        sessionId: payload.sessionId,
      };
    }

    const cached = await this.readCachedUser(payload.sub);
    if (cached && Date.now() - cached.cachedAt < AUTH_USER_CACHE_FRESH_MS) {
      return { ...cached, sessionId: payload.sessionId };
    }

    let user;
    try {
      user = await this.userRepository.findById(payload.sub);
    } catch (err) {
      // DB is unreachable — fall back to the last known role/email rather than
      // failing auth on every request across the app for the outage's duration.
      if (cached && this.isConnectionError(err)) {
        this.logger.warn(
          `DB lookup failed for user ${payload.sub}; serving cached identity (age ${Math.round((Date.now() - cached.cachedAt) / 1000)}s)`,
        );
        return { ...cached, sessionId: payload.sessionId };
      }
      throw err;
    }

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const authUser: CachedAuthUser = {
      id: user.id,
      email: user.email,
      role: user.role as AuthUser["role"],
      cachedAt: Date.now(),
    };
    await this.writeCachedUser(payload.sub, authUser);

    return { ...authUser, sessionId: payload.sessionId };
  }

  private isConnectionError(err: unknown): boolean {
    const e = err as { message?: string; code?: string };
    const msg = String(e?.message || "").toLowerCase();
    return (
      msg.includes("server has closed the connection") ||
      msg.includes("connection closed") ||
      msg.includes("can't reach database server") ||
      msg.includes("connection terminated") ||
      e?.code === "P1017" ||
      e?.code === "P1001" ||
      e?.code === "P1002"
    );
  }

  private async readCachedUser(userId: string): Promise<CachedAuthUser | null> {
    if (!RedisConnectionManager.isConnected()) return null;
    try {
      const raw = await RedisConnectionManager.getInstance().get(AUTH_USER_CACHE_KEY(userId));
      return raw ? (JSON.parse(raw) as CachedAuthUser) : null;
    } catch {
      return null;
    }
  }

  private async writeCachedUser(userId: string, user: CachedAuthUser): Promise<void> {
    if (!RedisConnectionManager.isConnected()) return;
    try {
      await RedisConnectionManager.getInstance().set(
        AUTH_USER_CACHE_KEY(userId),
        JSON.stringify(user),
        "EX",
        AUTH_USER_CACHE_TTL_SECONDS,
      );
    } catch {
      // Caching is a best-effort optimization — ignore write failures
    }
  }
}
