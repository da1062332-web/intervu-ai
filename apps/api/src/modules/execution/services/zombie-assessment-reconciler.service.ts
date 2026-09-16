import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { AppLogger } from "@intervu-ai/shared-logger";
import { PrismaService } from "../../../prisma/prisma.service";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import { EvaluationQueueService } from "../../evaluation/services/evaluation-queue.service";

/**
 * STATE-001: Zombie Assessment Reconciliation Service
 * -------------------------------------------------------
 * Periodically catches expired-but-still-IN_PROGRESS/CREATED TestInstances —
 * the case of a candidate who disconnected and never came back before their
 * timer ran out, so no heartbeat-driven auto-submit ever fired for them.
 *
 * Each one is routed through the same auto-submit + evaluation-enqueue path
 * as every other submission source (manual, proctoring strikes, admin force),
 * landing on AUTO_SUBMITTED so it flows into the admin recovery/review
 * workflow — never a bare status flip straight to COMPLETED, which would
 * silently skip both scoring and recovery for exactly the disconnected-
 * candidate case this service exists to catch.
 *
 * Runs every 5 minutes, bounding the staleness window to at most 5 minutes.
 */
@Injectable()
export class ZombieAssessmentReconcilerService {
  private readonly logger = new AppLogger({
    name: "ZombieAssessmentReconciler",
  });

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: RedisCacheService,
    private readonly evaluationQueueService: EvaluationQueueService,
  ) {}

  @Cron("*/5 * * * *")
  async reconcileExpiredAssessments() {
    try {
      const now = new Date();

      const expiredInstances = await this.prisma.testInstance.findMany({
        where: {
          status: { in: ["IN_PROGRESS", "CREATED"] },
          expiresAt: {
            lt: now,
            not: null,
          },
        },
        select: { id: true, userId: true },
      });

      if (expiredInstances.length === 0) return;

      let reconciledCount = 0;
      for (const instance of expiredInstances) {
        try {
          const reconciled = await this.autoSubmitExpiredInstance(instance.id, instance.userId, now);
          if (reconciled) reconciledCount++;
        } catch (error) {
          this.logger.error(`STATE-001: Failed to auto-submit expired instance ${instance.id}`, {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      if (reconciledCount > 0) {
        this.logger.info(
          `STATE-001: Reconciled ${reconciledCount} zombie assessment(s) via auto-submit`,
          { count: reconciledCount },
        );
      }
    } catch (error) {
      // Non-fatal: log and continue. Will retry on next cron tick.
      this.logger.error("STATE-001: Failed to reconcile expired assessments", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Shares the "submission-create" lock with SubmissionService,
   * ProctoringMonitoringService, and AttemptRecoveryService so this cron can
   * never race a submission that's already being created through another path.
   */
  private async autoSubmitExpiredInstance(
    testInstanceId: string,
    userId: string,
    now: Date,
  ): Promise<boolean> {
    const lockKey = `submission-create:${testInstanceId}`;
    const lockAcquired = await this.cacheService.acquireLock(lockKey, 30);
    if (!lockAcquired) {
      this.logger.warn("STATE-001: Submission already being created for this attempt; skipping this cron tick", {
        testInstanceId,
      });
      return false;
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Re-validate inside the transaction: another path may have already
        // submitted this attempt between the initial query and lock acquisition.
        const fresh = await tx.testInstance.findUnique({
          where: { id: testInstanceId },
          select: { status: true },
        });
        if (!fresh || (fresh.status !== "IN_PROGRESS" && fresh.status !== "CREATED")) {
          return null;
        }

        await tx.testInstance.update({
          where: { id: testInstanceId },
          data: { status: "AUTO_SUBMITTED", submittedAt: now },
        });

        const existingCount = await tx.submission.count({ where: { testInstanceId } });
        if (existingCount > 0) {
          await tx.submission.updateMany({
            where: { testInstanceId, isCurrent: true },
            data: { isCurrent: false },
          });
        }

        const submission = await tx.submission.create({
          data: {
            testInstanceId,
            status: "AUTO_SUBMITTED",
            source: "SYSTEM",
            reason: "TIME_EXPIRED",
            reasonDetails: "STATE-001: Timer expired while candidate was disconnected/silent; reconciled by zombie sweep",
            isAutoSubmit: true,
            attemptSequence: existingCount + 1,
            isCurrent: true,
            submittedAt: now,
          },
        });

        const answers = await tx.candidateAnswer.findMany({ where: { testInstanceId } });
        const answersMap: Record<string, string> = {};
        for (const a of answers) {
          answersMap[a.questionId] =
            typeof a.answer === "string" ? a.answer : JSON.stringify(a.answer ?? "");
        }

        return { submission, answersMap };
      });

      if (!result) return false;

      try {
        await this.evaluationQueueService.enqueueSubmission(
          result.submission.id,
          testInstanceId,
          userId,
          result.answersMap,
        );
      } catch (err) {
        this.logger.error("STATE-001: Failed enqueuing zombie-reconciled submission for evaluation", err, {
          testInstanceId,
          submissionId: result.submission.id,
        });
      }

      return true;
    } finally {
      await this.cacheService.releaseLock(lockKey);
    }
  }
}
