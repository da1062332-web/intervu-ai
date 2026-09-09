import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../../../prisma/prisma.service";
import { TestPoolManagerService } from "./test-pool-manager.service";

/**
 * Watches every exam config with the pre-generated test pool enabled and
 * tops it back up once its ready depth drops below poolMinThreshold.
 * Without this, toggling "poolEnabled" on has no effect — refillPool()
 * would otherwise only ever run if an admin manually called the
 * POST /assembly/pool/:configId/refill endpoint.
 */
@Injectable()
export class PoolRefillSchedulerService {
  private readonly logger = new Logger(PoolRefillSchedulerService.name);
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly poolManager: TestPoolManagerService,
  ) {}

  @Cron("*/5 * * * *")
  async handleCron() {
    if (this.isRunning) {
      this.logger.warn("[POOL-SCHEDULER ⚠️] Previous refill cycle still running; skipping this tick.");
      return;
    }

    this.isRunning = true;
    try {
      await this.refillAllEnabledPools();
    } finally {
      this.isRunning = false;
    }
  }

  async refillAllEnabledPools(): Promise<void> {
    const enabledConfigs = await this.prisma.ruleFlags.findMany({
      where: { poolEnabled: true },
      select: { examConfigId: true },
    });

    if (enabledConfigs.length === 0) {
      return;
    }

    this.logger.log(`[POOL-SCHEDULER 🔍] Checking ${enabledConfigs.length} pool-enabled config(s) for refill...`);

    for (const { examConfigId } of enabledConfigs) {
      try {
        const status = await this.poolManager.getPoolStatus(examConfigId);
        if (!status.needsRefill) {
          continue;
        }

        const needed = Math.max(
          status.poolRefillBatchSize,
          status.poolTargetSize - status.readyPoolCount,
        );
        this.logger.log(
          `[POOL-SCHEDULER 🚀] "${status.configName}" ready depth (${status.readyPoolCount}) below threshold (${status.poolMinThreshold}). Refilling ${needed}...`,
        );
        const result = await this.poolManager.refillPool(examConfigId, needed);
        this.logger.log(
          `[POOL-SCHEDULER ✅] "${status.configName}" refilled: +${result.added} (depth now ${result.currentDepth}).`,
        );
      } catch (err: any) {
        this.logger.error(
          `[POOL-SCHEDULER ❌] Refill failed for config ${examConfigId}: ${err?.message || err}`,
        );
      }
    }
  }
}
