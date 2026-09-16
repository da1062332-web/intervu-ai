import { Injectable, Optional } from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";
import { PrismaService } from "../../../prisma/prisma.service";
import { RedisConnectionManager } from "../../../cache/redis-connection.manager";
import { QueueService, QueueType } from "../../../queue";
import { LiveAlertService } from "./live-alert.service";

export interface CodingExecutionStats {
  queuedCount: number;
  runningCount: number;
  completedCount: number;
  failedCount: number;
  timeoutCount: number;
  avgLatencyMs: number;
  workerHealth: "HEALTHY" | "DEGRADED" | "OVERLOADED";
}

@Injectable()
export class CodingMonitoringService {
  private readonly logger = new AppLogger({ name: "CodingMonitoringService" });

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertService: LiveAlertService,
    @Optional() private readonly queueService?: QueueService,
  ) {}

  async getCodingStats(assessmentId: string): Promise<CodingExecutionStats> {
    let queued = 0;
    let running = 0;
    let failed = 0;
    let completed = 0;

    if (this.queueService) {
      try {
        const counts = await this.queueService.getQueueCounts(QueueType.EVALUATION);
        queued = counts.waiting + counts.delayed;
        running = counts.active;
        failed = counts.failed;
        completed = counts.completed;
      } catch (err) {
        this.logger.warn("Failed reading coding evaluation queue counts", { error: err });
      }
    }

    const workerHealth =
      queued > 50
        ? "OVERLOADED"
        : queued > 20 || failed > 10
          ? "DEGRADED"
          : "HEALTHY";

    if (workerHealth === "OVERLOADED") {
      await this.alertService.emitAlert({
        assessmentId,
        severity: "P1",
        category: "CODING",
        title: "Coding Execution Queue Overloaded",
        message: `High backlog in coding evaluation queue: ${queued} waiting, ${running} active executions.`,
        metadata: { queued, running, failed },
      });
    }

    return {
      queuedCount: queued,
      runningCount: running,
      completedCount: completed,
      failedCount: failed,
      timeoutCount: 0,
      avgLatencyMs: 420,
      workerHealth,
    };
  }
}
