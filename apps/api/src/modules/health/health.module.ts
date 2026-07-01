import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";

import { HealthService } from "./services/health.service";
import { RedisHealthIndicator } from "./services/redis-health.indicator";
import { WorkerHealthIndicator } from "./services/worker-health.indicator";
import { HealthController } from "./controllers/health.controller";

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [HealthService, RedisHealthIndicator, WorkerHealthIndicator],
  exports: [HealthService],
})
export class HealthModule {}
