import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';

import { ConfigModule } from './config';
import { HealthModule } from './modules/health';
import { AuthModule } from './modules/auth';
import { TestAssemblyModule } from './modules/test-assembly/test-assembly.module';
import { RequestLoggingMiddleware } from './common';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule, HealthModule, AuthModule, TestAssemblyModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
