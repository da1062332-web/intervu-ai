import { Global, Module } from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";
import { RedisCacheService } from "./redis-cache.service";
import { ConfigModule } from "../config/config.module";
import { AppConfigService } from "../config/config.service";

/**
 * CacheModule — Global NestJS DI wrapper for RedisCacheService.
 *
 * Declaring this @Global() means any module that is part of the NestJS
 * application can inject RedisCacheService without importing CacheModule
 * themselves. Register once in AppModule.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: RedisCacheService,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): RedisCacheService => {
        return new RedisCacheService(new AppLogger({ name: "CacheService" }), config);
      },
    },
  ],
  exports: [RedisCacheService],
})
export class CacheModule {}
