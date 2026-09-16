import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";
import { PrismaService } from "../../../prisma/prisma.service";
import { RedisConnectionManager } from "../../../cache/redis-connection.manager";
import { LiveMonitoringService } from "./live-monitoring.service";
import { LiveAlertService } from "./live-alert.service";
import { EvaluationQueueService } from "../../evaluation/services/evaluation-queue.service";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import {
  AuthorizeResumeDto,
  ExtendTimeDto,
  ForceSubmitDto,
} from "../dto/monitoring.dto";
import {
  MONITORING_CONFIG,
  REDIS_KEYS,
} from "../constants/monitoring.constants";

@Injectable()
export class AttemptRecoveryService {
  private readonly logger = new AppLogger({ name: "AttemptRecoveryService" });

  constructor(
    private readonly prisma: PrismaService,
    private readonly monitoringService: LiveMonitoringService,
    private readonly alertService: LiveAlertService,
    private readonly evaluationQueueService: EvaluationQueueService,
    private readonly cacheService: RedisCacheService,
  ) {}

  private isRedisAvailable(): boolean {
    return RedisConnectionManager.isConnected();
  }

  /**
   * Acquire a distributed lock in Redis to prevent concurrent operations on the same attempt
   */
  private async acquireRecoveryLock(attemptId: string): Promise<boolean> {
    if (!this.isRedisAvailable()) return true;
    try {
      const redis = RedisConnectionManager.getInstance();
      const lockKey = REDIS_KEYS.recoveryLock(attemptId);
      // NX: set only if not exists, EX: expire in seconds
      const acquired = await redis.set(
        lockKey,
        "locked",
        "EX",
        MONITORING_CONFIG.LOCK_RECOVERY_TTL_SECONDS,
        "NX",
      );
      return acquired === "OK";
    } catch (err) {
      this.logger.warn("Failed acquiring recovery lock in Redis, proceeding with DB concurrency checks", {
        error: err,
      });
      return true;
    }
  }

  private async releaseRecoveryLock(attemptId: string): Promise<void> {
    if (!this.isRedisAvailable()) return;
    try {
      const redis = RedisConnectionManager.getInstance();
      await redis.del(REDIS_KEYS.recoveryLock(attemptId));
    } catch (err) {
      // Ignore release error
    }
  }

  /**
   * Step 1: Admin reviews candidate auto-submission
   * State transition: AUTO_SUBMITTED -> ADMIN_REVIEW
   */
  async initiateReview(
    assessmentId: string,
    attemptId: string,
    adminId: string,
    adminEmail?: string,
  ): Promise<any> {
    const attempt = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
      select: { id: true, status: true, userId: true },
    });

    if (!attempt) throw new NotFoundException(`Attempt ${attemptId} not found`);

    if (attempt.status !== "AUTO_SUBMITTED" && attempt.status !== "SUBMITTED") {
      throw new BadRequestException(
        `Attempt is in status '${attempt.status}', cannot initiate recovery review. Only AUTO_SUBMITTED attempts can be reviewed.`,
      );
    }

    const updatedRecord = await this.monitoringService.transitionCandidateState(
      assessmentId,
      attemptId,
      "ADMIN_REVIEW",
      adminId,
      "ADMIN",
      `Admin ${adminEmail || adminId} initiated recovery review`,
      { adminId, adminEmail },
    );

    return {
      success: true,
      attemptId,
      status: "ADMIN_REVIEW",
      candidate: updatedRecord,
    };
  }

  /**
   * Step 2: Admin authorizes safe resume
   * State transition: ADMIN_REVIEW (or AUTO_SUBMITTED) -> RESUME_AUTHORIZED
   * - Acquires distributed lock
   * - Restores authoritative checkpoint
   * - Recalculates remaining time + extra time
   * - Reverses Submission record idempotently
   * - Creates immutable AttemptRecoveryLog
   */
  async authorizeResume(
    assessmentId: string,
    attemptId: string,
    adminId: string,
    adminEmail: string | undefined,
    dto: AuthorizeResumeDto,
  ): Promise<any> {
    const lockAcquired = await this.acquireRecoveryLock(attemptId);
    if (!lockAcquired) {
      throw new ConflictException(
        "Another recovery action is currently being executed for this candidate attempt. Please wait and refresh.",
      );
    }

    try {
      // 1. Fetch attempt and verify eligibility
      const attempt = await this.prisma.testInstance.findUnique({
        where: { id: attemptId },
        include: {
          executionState: true,
          submissions: { orderBy: { attemptSequence: "desc" } },
          recoveryLogs: true,
        },
      });

      if (!attempt) throw new NotFoundException(`Attempt ${attemptId} not found`);

      // Verify resume limit
      const resumeCount = attempt.recoveryLogs.filter(
        (l) => l.newStatus === "RESUME_AUTHORIZED" || l.newStatus === "RESUMED",
      ).length;
      if (resumeCount >= MONITORING_CONFIG.MAX_RESUMES_PER_ATTEMPT) {
        throw new BadRequestException(
          `Maximum allowed resumes (${MONITORING_CONFIG.MAX_RESUMES_PER_ATTEMPT}) exceeded for this candidate attempt.`,
        );
      }

      // Check current status
      const validStatuses = ["AUTO_SUBMITTED", "ADMIN_REVIEW", "SUBMITTED"];
      if (!validStatuses.includes(attempt.status as string)) {
        throw new ConflictException(
          `Attempt is already in status '${attempt.status}', cannot authorize resume.`,
        );
      }

      // 2. Compute accurate new expiresAt and remainingTime
      const extraSeconds = (dto.extraTimeMinutes || 0) * 60;
      let authoritativeRemainingSeconds = attempt.executionState?.remainingTimeSeconds ?? 1800;
      if (authoritativeRemainingSeconds < 60) {
        authoritativeRemainingSeconds = 300; // Guarantee at least 5 minutes if timer was depleted
      }

      const totalNewRemainingSeconds = authoritativeRemainingSeconds + extraSeconds;
      const newExpiresAt = new Date(Date.now() + totalNewRemainingSeconds * 1000);

      // 3. Atomically perform DB updates inside transaction
      const correlationId = `recov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const answersCount = await this.prisma.candidateAnswer.count({
        where: { testInstanceId: attemptId },
      });

      const checkpointSnapshot = {
        currentSectionKey: attempt.executionState?.currentSectionKey || "section-1",
        currentSectionIndex: attempt.executionState?.currentSectionIndex ?? 0,
        currentQuestionId: attempt.executionState?.currentQuestionId || "",
        currentQuestionIndex: attempt.executionState?.currentQuestionIndex ?? 0,
        remainingTimeSeconds: totalNewRemainingSeconds,
        answersCount,
      };

      await this.prisma.$transaction(async (tx) => {
        // Concurrency Re-validation inside Transaction:
        // Ensures only ONE recovery operation can ever execute in race conditions
        const freshAttempt = await tx.testInstance.findUnique({
          where: { id: attemptId },
          select: { status: true },
        });

        if (!freshAttempt || !validStatuses.includes(freshAttempt.status as string)) {
          throw new ConflictException(
            `Concurrent recovery conflict: Attempt status has already transitioned to '${freshAttempt?.status}'. Duplicate action rejected.`,
          );
        }

        // Update TestInstance
        await tx.testInstance.update({
          where: { id: attemptId },
          data: {
            status: "RESUME_AUTHORIZED",
            expiresAt: newExpiresAt,
          },
        });

        // Update ExecutionState timer
        if (attempt.executionState) {
          await tx.executionState.update({
            where: { testInstanceId: attemptId },
            data: {
              remainingTimeSeconds: totalNewRemainingSeconds,
              lastActivityAt: new Date(),
            },
          });
        }

        // Forensic Immutability: DO NOT mutate previous submission records!
        // Leave previous AUTO_SUBMITTED record intact and unmutated for audit correctness,
        // merely marking isCurrent = false so the next submission becomes isCurrent = true.
        await tx.submission.updateMany({
          where: { testInstanceId: attemptId, isCurrent: true },
          data: {
            isCurrent: false,
          },
        });

        // Insert AttemptRecoveryLog
        await tx.attemptRecoveryLog.create({
          data: {
            attemptId,
            adminId,
            adminEmail,
            previousStatus: attempt.status,
            newStatus: "RESUME_AUTHORIZED",
            reason: dto.reason,
            extraTimeSeconds: extraSeconds,
            checkpointData: checkpointSnapshot,
            correlationId,
          },
        });

        // Insert AssessmentAuditLog
        await tx.assessmentAuditLog.create({
          data: {
            attemptId,
            candidateId: attempt.userId,
            assessmentId,
            eventType: "ADMIN_RESUME",
            source: "ADMIN",
            severity: "P2",
            actorId: adminId,
            actorRole: "ADMIN",
            correlationId,
            metadata: {
              reason: dto.reason,
              extraTimeMinutes: dto.extraTimeMinutes,
              checkpointRestored: checkpointSnapshot,
            },
          },
        });

        // Insert AssessmentEvent
        await tx.assessmentEvent.create({
          data: {
            assessmentId,
            attemptId,
            candidateId: attempt.userId,
            eventType: "ADMIN_RESUME",
            source: "ADMIN",
            severity: "P2",
            correlationId,
            metadata: {
              reason: dto.reason,
              extraTimeMinutes: dto.extraTimeMinutes,
            },
          },
        });
      });

      // 4. Update Live State in Redis
      let liveRecord = await this.monitoringService.getCandidateLiveRecord(assessmentId, attemptId);
      if (liveRecord) {
        liveRecord.status = "RESUME_AUTHORIZED";
        liveRecord.remainingTimeSeconds = totalNewRemainingSeconds;
        liveRecord.extraTimeGrantedSeconds = extraSeconds;
        liveRecord.isNeedsAttention = false;
        liveRecord.incidentReasons = [];

        if (this.isRedisAvailable()) {
          const redis = RedisConnectionManager.getInstance();
          await redis.set(
            REDIS_KEYS.attemptState(assessmentId, attemptId),
            JSON.stringify(liveRecord),
            "EX",
            MONITORING_CONFIG.REDIS_STATE_TTL_SECONDS,
          );

          // Invalidate cached execution state & test-instance meta
          await Promise.allSettled([
            redis.del(`test-instance:meta:${attemptId}`),
            redis.del(`execution-state:${attemptId}`),
            redis.del(`assessment-snapshot:${attemptId}`),
          ]);

          // Broadcast resume event over SSE
          await redis.publish(
            REDIS_KEYS.assessmentEventsChannel(assessmentId),
            JSON.stringify({
              type: "RECOVERY_RESUME_AUTHORIZED",
              payload: {
                attemptId,
                candidateId: attempt.userId,
                newExpiresAt: newExpiresAt.toISOString(),
                extraTimeMinutes: dto.extraTimeMinutes,
                reason: dto.reason,
                adminEmail: adminEmail || adminId,
              },
              timestamp: new Date().toISOString(),
            }),
          );
        }
      }

      this.logger.info(`Admin ${adminEmail || adminId} authorized resume for attempt ${attemptId}`, {
        attemptId,
        extraTimeMinutes: dto.extraTimeMinutes,
        correlationId,
      });

      return {
        success: true,
        attemptId,
        status: "RESUME_AUTHORIZED",
        newExpiresAt: newExpiresAt.toISOString(),
        extraTimeGrantedSeconds: extraSeconds,
        authoritativeRemainingSeconds: totalNewRemainingSeconds,
        checkpointRestored: checkpointSnapshot,
      };
    } finally {
      await this.releaseRecoveryLock(attemptId);
    }
  }

  /**
   * Candidate handshake: When candidate connects and resumes
   * State transition: RESUME_AUTHORIZED -> RESUMED -> IN_PROGRESS
   */
  async confirmCandidateResumed(
    attemptId: string,
    candidateId: string,
  ): Promise<any> {
    const attempt = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
      include: { executionState: true },
    });

    if (!attempt) throw new NotFoundException(`Attempt ${attemptId} not found`);
    if (attempt.userId !== candidateId) {
      throw new BadRequestException("Unauthorized attempt ownership");
    }

    if (attempt.status !== "RESUME_AUTHORIZED" && attempt.status !== "IN_PROGRESS") {
      return {
        status: attempt.status,
        canResume: false,
      };
    }

    // Move to IN_PROGRESS in DB
    await this.prisma.testInstance.update({
      where: { id: attemptId },
      data: { status: "IN_PROGRESS" },
    });

    const assessmentId = await this.monitoringService.resolveAssessmentId(attemptId);
    const liveRecord = await this.monitoringService.getCandidateLiveRecord(assessmentId, attemptId);
    if (liveRecord) {
      liveRecord.status = "ACTIVE";
      liveRecord.isNeedsAttention = false;
      liveRecord.incidentReasons = [];

      if (this.isRedisAvailable()) {
        const redis = RedisConnectionManager.getInstance();
        await redis.set(
          REDIS_KEYS.attemptState(assessmentId, attemptId),
          JSON.stringify(liveRecord),
          "EX",
          MONITORING_CONFIG.REDIS_STATE_TTL_SECONDS,
        );
      }
    }

    let remTime = 1800;
    if (attempt.expiresAt) {
      remTime = Math.max(0, Math.floor((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000));
    }

    return {
      success: true,
      canResume: true,
      status: "ACTIVE",
      remainingTimeSeconds: remTime,
      expiresAt: attempt.expiresAt?.toISOString(),
      currentSectionIndex: attempt.executionState?.currentSectionIndex ?? 0,
      currentQuestionIndex: attempt.executionState?.currentQuestionIndex ?? 0,
    };
  }

  /**
   * Admin Force Submit: Forcibly submits a stuck or non-compliant attempt
   */
  async adminForceSubmit(
    assessmentId: string,
    attemptId: string,
    adminId: string,
    adminEmail: string | undefined,
    dto: ForceSubmitDto,
  ): Promise<any> {
    const attempt = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
      select: { id: true, status: true, userId: true },
    });

    if (!attempt) throw new NotFoundException(`Attempt ${attemptId} not found`);

    const source = dto.source || "ADMIN";
    const reason = dto.reason || "ADMIN_ACTION";
    const reasonDetails = dto.reasonDetails || `Terminated and submitted by Admin ${adminEmail || adminId}`;

    // Shares a distributed lock with SubmissionService and
    // ProctoringMonitoringService's strike auto-submit so a candidate's own
    // in-flight submit can never race this admin action into two isCurrent rows.
    const lockKey = `submission-create:${attemptId}`;
    const lockAcquired = await this.cacheService.acquireLock(lockKey, 30);
    if (!lockAcquired) {
      throw new ConflictException(
        "Another submission is already being created for this attempt. Please wait and retry.",
      );
    }

    let submission: { id: string };
    let answersMap: Record<string, string>;
    try {
      ({ submission, answersMap } = await this.prisma.$transaction(async (tx) => {
        await tx.testInstance.update({
          where: { id: attemptId },
          data: {
            status: "SUBMITTED",
            submittedAt: new Date(),
          },
        });

        const existingSubmissionsCount = await tx.submission.count({
          where: { testInstanceId: attemptId },
        });
        if (existingSubmissionsCount > 0) {
          await tx.submission.updateMany({
            where: { testInstanceId: attemptId, isCurrent: true },
            data: { isCurrent: false },
          });
        }

        const submission = await tx.submission.create({
          data: {
            testInstanceId: attemptId,
            status: "SUBMITTED",
            source: source as any,
            reason: reason as any,
            reasonDetails,
            isAutoSubmit: true,
            attemptSequence: existingSubmissionsCount + 1,
            isCurrent: true,
            submittedAt: new Date(),
          },
        });

        await tx.assessmentAuditLog.create({
          data: {
            attemptId,
            candidateId: attempt.userId,
            assessmentId,
            eventType: "ADMIN_FORCE_SUBMIT",
            source: "ADMIN",
            actorId: adminId,
            actorRole: "ADMIN",
            metadata: { reason, reasonDetails },
          },
        });

        const answers = await tx.candidateAnswer.findMany({ where: { testInstanceId: attemptId } });
        const answersMap: Record<string, string> = {};
        for (const a of answers) {
          answersMap[a.questionId] =
            typeof a.answer === "string" ? a.answer : JSON.stringify(a.answer ?? "");
        }

        return { submission, answersMap };
      }));
    } finally {
      await this.cacheService.releaseLock(lockKey);
    }

    // The submission is already committed at this point. A stale/out-of-sync
    // live-state transition must never surface as a failure to the admin —
    // that would invite a retry that creates a duplicate Submission row.
    try {
      await this.monitoringService.transitionCandidateState(
        assessmentId,
        attemptId,
        "SUBMITTED",
        adminId,
        "ADMIN",
        reasonDetails,
      );
    } catch (err) {
      this.logger.warn("Force-submit committed but live-state transition failed; DB status is authoritative", {
        attemptId,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    try {
      await this.evaluationQueueService.enqueueSubmission(
        submission.id,
        attemptId,
        attempt.userId,
        answersMap,
      );
    } catch (err) {
      this.logger.error("Failed enqueuing admin force-submission for evaluation", err, {
        attemptId,
        submissionId: submission.id,
      });
    }

    return {
      success: true,
      attemptId,
      status: "SUBMITTED",
      submittedAt: new Date().toISOString(),
    };
  }

  /**
   * Admin Extend Time: Adds extra minutes to an ongoing candidate attempt
   */
  async adminExtendTime(
    assessmentId: string,
    attemptId: string,
    adminId: string,
    adminEmail: string | undefined,
    dto: ExtendTimeDto,
  ): Promise<any> {
    const attempt = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
      include: { executionState: true },
    });

    if (!attempt) throw new NotFoundException(`Attempt ${attemptId} not found`);

    const extraSeconds = dto.extraMinutes * 60;
    const currentExpires = attempt.expiresAt ? new Date(attempt.expiresAt).getTime() : Date.now() + 3600000;
    const newExpiresAt = new Date(currentExpires + extraSeconds * 1000);
    const newRemainingSeconds = Math.max(
      0,
      Math.floor((newExpiresAt.getTime() - Date.now()) / 1000),
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.testInstance.update({
        where: { id: attemptId },
        data: { expiresAt: newExpiresAt },
      });

      if (attempt.executionState) {
        await tx.executionState.update({
          where: { testInstanceId: attemptId },
          data: {
            remainingTimeSeconds: newRemainingSeconds,
            lastActivityAt: new Date(),
          },
        });
      }

      await tx.assessmentAuditLog.create({
        data: {
          attemptId,
          candidateId: attempt.userId,
          assessmentId,
          eventType: "TIME_ADJUSTED",
          source: "ADMIN",
          actorId: adminId,
          actorRole: "ADMIN",
          metadata: {
            extraMinutes: dto.extraMinutes,
            reason: dto.reason,
            newExpiresAt: newExpiresAt.toISOString(),
          },
        },
      });
    });

    // Update Redis live state
    const liveRecord = await this.monitoringService.getCandidateLiveRecord(assessmentId, attemptId);
    if (liveRecord) {
      liveRecord.remainingTimeSeconds = newRemainingSeconds;
      liveRecord.extraTimeGrantedSeconds = (liveRecord.extraTimeGrantedSeconds || 0) + extraSeconds;

      if (this.isRedisAvailable()) {
        const redis = RedisConnectionManager.getInstance();
        await redis.set(
          REDIS_KEYS.attemptState(assessmentId, attemptId),
          JSON.stringify(liveRecord),
          "EX",
          MONITORING_CONFIG.REDIS_STATE_TTL_SECONDS,
        );

        // Broadcast time extended event
        await redis.publish(
          REDIS_KEYS.assessmentEventsChannel(assessmentId),
          JSON.stringify({
            type: "TIME_ADJUSTED",
            payload: {
              attemptId,
              candidateId: attempt.userId,
              extraMinutes: dto.extraMinutes,
              newExpiresAt: newExpiresAt.toISOString(),
              reason: dto.reason,
            },
            timestamp: new Date().toISOString(),
          }),
        );
      }
    }

    return {
      success: true,
      attemptId,
      extraMinutes: dto.extraMinutes,
      newExpiresAt: newExpiresAt.toISOString(),
      newRemainingSeconds,
    };
  }
}
