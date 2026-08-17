import { Injectable } from "@nestjs/common";
import { ConfigService as NestConfigService } from "@nestjs/config";

import { EnvConfig } from "./env.schema";

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: NestConfigService<EnvConfig>) {}

  get nodeEnv(): string {
    return (
      this.configService?.get<string>("NODE_ENV", "development") ||
      process.env.NODE_ENV ||
      "development"
    );
  }

  get port(): number {
    return (
      this.configService?.get<number>("PORT", 3000) ||
      Number(process.env.PORT) ||
      3000
    );
  }

  get databaseUrl(): string {
    return (
      this.configService?.get<string>("DATABASE_URL", "") ||
      process.env.DATABASE_URL ||
      ""
    );
  }

  get redisUrl(): string {
    return (
      this.configService?.get<string>("REDIS_URL", "") ||
      process.env.REDIS_URL ||
      "redis://localhost:6379"
    );
  }

  get jwtSecret(): string {
    const secret =
      this.configService?.get<string>("JWT_SECRET") || process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
      if (this.nodeEnv !== "test") {
        return "dev_jwt_secret_must_be_at_least_32_chars_long_key_12345";
      }
      return (
        secret || "dev_jwt_secret_must_be_at_least_32_chars_long_key_12345"
      );
    }
    return secret;
  }

  get jwtRefreshSecret(): string {
    const secret =
      this.configService?.get<string>("JWT_REFRESH_SECRET") ||
      process.env.JWT_REFRESH_SECRET;
    if (!secret || secret.length < 32) {
      if (this.nodeEnv !== "test") {
        return "dev_jwt_refresh_secret_must_be_at_least_32_chars_long_key_67890";
      }
      return (
        secret ||
        "dev_jwt_refresh_secret_must_be_at_least_32_chars_long_key_67890"
      );
    }
    return secret;
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === "development";
  }

  get openAiApiKey(): string {
    return (
      this.configService?.get<string>("OPENAI_API_KEY", "") ||
      process.env.OPENAI_API_KEY ||
      ""
    );
  }

  get rateLimits() {
    return {
      auth: {
        limit: this.configService?.get<number>("AUTH_LIMIT", 10) || 10,
        ttl: this.configService?.get<number>("AUTH_TTL", 60000) || 60000,
      },
      assessment: {
        limit: this.configService?.get<number>("ASSESSMENT_LIMIT", 60) || 60,
        ttl: this.configService?.get<number>("ASSESSMENT_TTL", 60000) || 60000,
      },
      submission: {
        limit: this.configService?.get<number>("SUBMISSION_LIMIT", 5) || 5,
        ttl: this.configService?.get<number>("SUBMISSION_TTL", 60000) || 60000,
      },
      default: {
        limit: this.configService?.get<number>("DEFAULT_LIMIT", 100) || 100,
        ttl: this.configService?.get<number>("DEFAULT_TTL", 60000) || 60000,
      },
    };
  }

  get isProduction(): boolean {
    return this.nodeEnv === "production";
  }

  get googleClientId(): string {
    return this.configService.get<string>("GOOGLE_CLIENT_ID", "") || "";
  }

  get googleClientSecret(): string {
    return this.configService.get<string>("GOOGLE_CLIENT_SECRET", "") || "";
  }

  get corsAllowedOrigins(): string[] {
    const raw =
      this.configService?.get<string>("CORS_ALLOWED_ORIGINS") ||
      process.env.CORS_ALLOWED_ORIGINS;
    if (raw) {
      return raw
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);
    }
    return [];
  }
}
