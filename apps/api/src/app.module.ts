import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';

import { ConfigModule } from './config';
import { HealthModule } from './modules/health';
import { AuthModule } from './modules/auth';
import { UsersModule } from './modules/users';
import { TemplateLibraryModule } from './modules/template-library';
import { TestAssemblyModule } from './modules/test-assembly';
import { SystemConfigModule } from './modules/config';
import { RequestLoggingMiddleware, CorrelationMiddleware } from './common';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    TemplateLibraryModule,
    TestAssemblyModule,
    SystemConfigModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationMiddleware)
      .forRoutes('*')
      .apply(RequestLoggingMiddleware)
      .forRoutes('*');
  }
}