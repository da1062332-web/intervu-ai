import { Injectable } from "@nestjs/common";
import { ConfigService as NestConfigService } from "@nestjs/config";

import { EnvConfig } from "./env.schema";

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: NestConfigService<EnvConfig>) {}

  get nodeEnv(): string {
    return (
      this.configService.get<string>("NODE_ENV", "development") || "development"
    );
  }

  get port(): number {
    return this.configService.get<number>("PORT", 3000) || 3000;
  }

  get databaseUrl(): string {
    return this.configService.get<string>("DATABASE_URL", "") || "";
  }

  get redisUrl(): string {
    return this.configService.get<string>("REDIS_URL", "") || "";
  }

  get jwtSecret(): string {
    return this.configService.get<string>("JWT_SECRET", "") || "";
  }

  get jwtRefreshSecret(): string {
    return this.configService.get<string>("JWT_REFRESH_SECRET", "") || "";
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === "development";
  }

  get openAiApiKey(): string {
    return this.configService.get<string>("OPENAI_API_KEY", "") || "";
  }

  get rateLimits() {
    return {
      auth: {
        limit: this.configService.get<number>("AUTH_LIMIT", 10) || 10,
        ttl: this.configService.get<number>("AUTH_TTL", 60000) || 60000,
      },
      assessment: {
        limit: this.configService.get<number>("ASSESSMENT_LIMIT", 60) || 60,
        ttl: this.configService.get<number>("ASSESSMENT_TTL", 60000) || 60000,
      },
      submission: {
        limit: this.configService.get<number>("SUBMISSION_LIMIT", 5) || 5,
        ttl: this.configService.get<number>("SUBMISSION_TTL", 60000) || 60000,
      },
      default: {
        limit: this.configService.get<number>("DEFAULT_LIMIT", 100) || 100,
        ttl: this.configService.get<number>("DEFAULT_TTL", 60000) || 60000,
      },
    };
  }

  get isProduction(): boolean {
    return this.nodeEnv === "production";
  }
}
