import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { CacheModule } from "../../cache/cache.module";
import { QueueModule } from "../../queue/queue.module";
import { EvaluationModule } from "../evaluation/evaluation.module";
import { LiveMonitoringService } from "./services/live-monitoring.service";
import { AttemptRecoveryService } from "./services/attempt-recovery.service";
import { LiveAlertService } from "./services/live-alert.service";
import { SystemHealthService } from "./services/system-health.service";
import { ProctoringMonitoringService } from "./services/proctoring-monitoring.service";
import { CodingMonitoringService } from "./services/coding-monitoring.service";
import { LiveMonitoringController } from "./controllers/live-monitoring.controller";
import { MonitoringSseController } from "./controllers/monitoring-sse.controller";
import { CandidateTelemetryController } from "./controllers/candidate-telemetry.controller";

@Module({
  imports: [PrismaModule, CacheModule, QueueModule, EvaluationModule],
  providers: [
    LiveMonitoringService,
    AttemptRecoveryService,
    LiveAlertService,
    SystemHealthService,
    ProctoringMonitoringService,
    CodingMonitoringService,
  ],
  controllers: [
    LiveMonitoringController,
    MonitoringSseController,
    CandidateTelemetryController,
  ],
  exports: [
    LiveMonitoringService,
    AttemptRecoveryService,
    LiveAlertService,
    ProctoringMonitoringService,
    CodingMonitoringService,
  ],
})
export class MonitoringModule {}
