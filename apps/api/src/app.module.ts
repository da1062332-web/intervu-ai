import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";

import { ConfigModule } from "./config";
import { CacheModule } from "./cache";
import { QueueModule } from "./queue";
import { HealthModule } from "./modules/health";
import { AuthModule } from "./modules/auth";
import { UsersModule } from "./modules/users";
import { TemplateLibraryModule } from "./modules/template-library";
import { TestAssemblyModule } from "./modules/test-assembly";
import { SystemConfigModule } from "./modules/config";
import { GenerationModule } from "./modules/generation";
import { QueueMonitorModule } from "./modules/queue-monitor";
import { ExecutionModule } from "./modules/execution/execution.module";
import { EvaluationModule } from "./modules/evaluation/evaluation.module";
import { DecisionModule } from "./modules/decision/decision.module";
import { CorrelationMiddleware, RequestLoggingMiddleware } from "./common";
import { PrismaModule } from "./prisma/prisma.module";
import { DashboardModule } from "./modules/dashboard";
import { TestsModule } from "./modules/tests/tests.module";

@Module({
  imports: [
    // Infrastructure — must be first (ConfigModule provides env vars)
    ConfigModule,
    PrismaModule,

    // Global services — CacheModule and QueueModule are @Global(),
    // so all subsequent modules can inject RedisCacheService and QueueService
    CacheModule,
    QueueModule,

    // Feature modules
    HealthModule,
    AuthModule,
    UsersModule,
    TemplateLibraryModule,
    TestAssemblyModule,
    SystemConfigModule,
    GenerationModule,
    QueueMonitorModule,
    ExecutionModule,
    EvaluationModule,
    DecisionModule,
    DashboardModule,
    TestsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationMiddleware)
      .forRoutes("*")
      .apply(RequestLoggingMiddleware)
      .forRoutes("*");
  }
}
