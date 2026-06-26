import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { GenerationModule } from "../generation/generation.module";
import { QuestionBankModule } from "../question-bank/question-bank.module";
import { AssemblyModule } from "../assembly/assembly.module";
import { ExecutionModule } from "../execution/execution.module";
import { EvaluationModule } from "../evaluation/evaluation.module";

import { EventBusService } from "./integrations/event-bus/event-bus.service";
import { PlatformOrchestratorService } from "./services/platform-orchestrator.service";
import { PlatformHealthService } from "./health/platform-health.service";
import { PlatformAuditService } from "./audit/platform-audit.service";
import { PlatformMetricsController } from "./controllers/platform-metrics.controller";

@Module({
  imports: [
    PrismaModule,
    GenerationModule,
    QuestionBankModule,
    AssemblyModule,
    ExecutionModule,
    EvaluationModule,
  ],
  controllers: [PlatformMetricsController],
  providers: [
    EventBusService,
    PlatformOrchestratorService,
    PlatformHealthService,
    PlatformAuditService,
  ],
  exports: [EventBusService, PlatformOrchestratorService, PlatformHealthService, PlatformAuditService],
})
export class PlatformModule {}
