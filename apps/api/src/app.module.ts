import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';

import { ConfigModule } from './config';
import { HealthModule } from './modules/health';
import { RequestLoggingMiddleware } from './common';

@Module({
  imports: [ConfigModule, HealthModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}