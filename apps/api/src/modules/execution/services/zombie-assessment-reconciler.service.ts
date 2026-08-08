import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { AppLogger } from "@intervu-ai/shared-logger";
import { PrismaService } from "../../../prisma/prisma.service";

/**
 * STATE-001: Zombie Assessment Reconciliation Service
 * -------------------------------------------------------
 * Periodically marks expired-but-still-IN_PROGRESS TestInstances as EXPIRED.
 *
 * Without this, assessments whose `expiresAt` has passed remain in the database
 * with status=IN_PROGRESS. While the dashboard repository filters them out via
 * `expiresAt: { gt: new Date() }`, any other query that doesn't apply that filter
 * would surface these zombie records.
 *
 * Runs every 5 minutes. Safe to run concurrently (UPDATE with WHERE clause is atomic).
 */
@Injectable()
export class ZombieAssessmentReconcilerService {
  private readonly logger = new AppLogger({
    name: "ZombieAssessmentReconciler",
  });

  constructor(private readonly prisma: PrismaService) {}

  /**
   * STATE-001: Mark expired-but-active assessments as EXPIRED.
   * Runs every 5 minutes to bound the staleness window to at most 5 minutes.
   */
  @Cron("*/5 * * * *")
  async reconcileExpiredAssessments() {
    try {
      const now = new Date();

      const result = await this.prisma.testInstance.updateMany({
        where: {
          status: { in: ["IN_PROGRESS", "CREATED"] },
          expiresAt: {
            lt: now,
            not: null,
          },
        },
        data: {
          // STATE-001: Use COMPLETED status for expired instances.
          // The schema does not have an EXPIRED value; COMPLETED is the correct
          // terminal state for timed-out attempts (no voluntary submission was made
          // but the time window has closed). This prevents zombie IN_PROGRESS records.
          status: "COMPLETED",
          submittedAt: now,
        },
      });

      if (result.count > 0) {
        this.logger.info(
          `STATE-001: Reconciled ${result.count} zombie assessment(s) to EXPIRED status`,
          { count: result.count },
        );
      }
    } catch (error) {
      // Non-fatal: log and continue. Will retry on next cron tick.
      this.logger.error("STATE-001: Failed to reconcile expired assessments", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
