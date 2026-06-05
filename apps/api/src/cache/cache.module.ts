import { Global, Module } from '@nestjs/common';
import { AppLogger } from '@intervu-ai/shared-logger';
import { RedisCacheService } from './redis-cache.service';

/**
 * CacheModule — Global NestJS DI wrapper for RedisCacheService.
 *
 * Declaring this @Global() means any module that is part of the NestJS
 * application can inject RedisCacheService without importing CacheModule
 * themselves. Register once in AppModule.
 */
@Global()
@Module({
  providers: [
    {
      provide: RedisCacheService,
      useFactory: (): RedisCacheService => {
        return new RedisCacheService(new AppLogger({ name: 'CacheService' }));
      },
    },
  ],
  exports: [RedisCacheService],
})
export class CacheModule {}
