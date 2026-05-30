import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

import { EnvConfig } from './env.schema';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: NestConfigService<EnvConfig>) {}

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development') || 'development';
  }

  get port(): number {
    return this.configService.get<number>('PORT', 3000) || 3000;
  }

  get databaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL', '') || '';
  }

  get redisUrl(): string {
    return this.configService.get<string>('REDIS_URL', '') || '';
  }

  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET', '') || '';
  }

  get jwtRefreshSecret(): string {
    return this.configService.get<string>('JWT_REFRESH_SECRET', '') || '';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }
}
