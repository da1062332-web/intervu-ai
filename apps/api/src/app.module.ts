import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { CustomThrottlerGuard } from "./common";
import { RolesGuard } from "./modules/auth/guards/roles.guard";
import { JwtAuthGuard } from "./modules/auth/guards/jwt-auth.guard";

import { ConfigModule, rateLimitConfig } from "./config";
import { CacheModule } from "./cache";
import { QueueModule } from "./queue";
import { HealthModule } from "./modules/health";
import { AuthModule } from "./modules/auth";
import { UsersModule } from "./modules/users";
import { TemplateLibraryModule } from "./modules/template-library";
import { TestAssemblyModule } from "./modules/test-assembly";
import { SystemConfigModule } from "./modules/config";
import { AssemblyModule } from "./modules/assembly/assembly.module";
import { QuestionPoolModule } from "./modules/question-pool/question-pool.module";
import { QuestionBankModule } from "./modules/question-bank/question-bank.module";
import { GenerationModule } from "./modules/generation";
import { QueueMonitorModule } from "./modules/queue-monitor";
import { ExecutionModule } from "./modules/execution/execution.module";
import { EvaluationModule } from "./modules/evaluation/evaluation.module";
import { DecisionModule } from "./modules/decision/decision.module";
import { CorrelationMiddleware, RequestLoggingMiddleware } from "./common";
import { PrismaModule } from "./prisma/prisma.module";
import { DashboardModule } from "./modules/dashboard";
import { TestsModule } from "./modules/tests/tests.module";
import { ResultsModule } from "./modules/results/results.module";
import { AdminConfigModule } from "./modules/admin-config/admin-config.module";
import { DifficultyDistributionModule } from "./modules/difficulty-distribution/difficulty-distribution.module";
import { RuleFlagsModule } from "./modules/rule-flags/rule-flags.module";
import { ConceptMappingModule } from "./modules/concept-mapping/concept-mapping.module";
import { TopicSectionMappingModule } from "./modules/topic-section-mapping/topic-section-mapping.module";
import { BlueprintModule } from "./modules/blueprint/blueprint.module";
import { BlueprintConfigModule } from "./modules/blueprint-config/blueprint-config.module";
import { ValidationModule } from "./modules/validation/validation.module";

@Module({
  imports: [
    // Infrastructure — must be first (ConfigModule provides env vars)
    ConfigModule,
    PrismaModule,
    ThrottlerModule.forRootAsync(rateLimitConfig),

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
    AssemblyModule,
    QuestionPoolModule,
    QuestionBankModule,
    SystemConfigModule,
    GenerationModule,
    QueueMonitorModule,
    ExecutionModule,
    EvaluationModule,
    DecisionModule,
    DashboardModule,
    TestsModule,
    ResultsModule,
    AdminConfigModule,
    DifficultyDistributionModule,
    RuleFlagsModule,
    ConceptMappingModule,
    TopicSectionMappingModule,
    BlueprintModule,
    BlueprintConfigModule,
    ValidationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
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
