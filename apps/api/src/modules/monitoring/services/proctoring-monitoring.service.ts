import { Injectable } from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";
import { PrismaService } from "../../../prisma/prisma.service";
import { RedisConnectionManager } from "../../../cache/redis-connection.manager";
import { LiveMonitoringService } from "./live-monitoring.service";
import { LiveAlertService } from "./live-alert.service";
import { EvaluationQueueService } from "../../evaluation/services/evaluation-queue.service";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import { MONITORING_CONFIG, REDIS_KEYS } from "../constants/monitoring.constants";
import { CandidateProctoringTelemetryDto } from "../dto/monitoring.dto";

@Injectable()
export class ProctoringMonitoringService {
  private readonly logger = new AppLogger({ name: "ProctoringMonitoringService" });

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

  async handleProctoringEvent(
    attemptId: string,
    candidateId: string,
    dto: CandidateProctoringTelemetryDto,
  ): Promise<{ strikeCount: number; isAutoSubmitted: boolean }> {
    const assessmentId = await this.monitoringService.resolveAssessmentId(attemptId);
    let liveRecord = await this.monitoringService.getCandidateLiveRecord(assessmentId, attemptId);
    if (!liveRecord) {
      liveRecord = await this.monitoringService.hydrateLiveRecordFromDb(attemptId, candidateId, assessmentId);
    }

    // Strikes are the server's own counter — never trust a client-supplied
    // strikeCount, or a modified client can report an artificially low value
    // and the max-strikes auto-submit will never trigger.
    const currentStrikes = liveRecord.proctoringStrikes + 1;

    this.logger.warn(`Proctoring violation [${dto.eventType}] for candidate ${candidateId} (Strike #${currentStrikes})`, {
      attemptId,
      eventType: dto.eventType,
      strikes: currentStrikes,
    });

    // Write immutable event
    await this.prisma.assessmentEvent.create({
      data: {
        assessmentId,
        attemptId,
        candidateId,
        eventType: `PROCTORING_${dto.eventType}`,
        source: "RULE_ENGINE",
        severity: currentStrikes >= MONITORING_CONFIG.HIGH_STRIKE_THRESHOLD ? "P1" : "P2",
        metadata: {
          violationType: dto.eventType,
          strikeCount: currentStrikes,
          ...dto.metadata,
        },
      },
    });

    // Write audit log
    await this.prisma.assessmentAuditLog.create({
      data: {
        attemptId,
        candidateId,
        assessmentId,
        eventType: `PROCTORING_VIOLATION`,
        source: "RULE_ENGINE",
        severity: currentStrikes >= MONITORING_CONFIG.HIGH_STRIKE_THRESHOLD ? "P1" : "P2",
        metadata: {
          violationType: dto.eventType,
          strikeCount: currentStrikes,
          details: dto.metadata,
        },
      },
    });

    let isAutoSubmitted = false;

    // Check if max strikes reached
    if (currentStrikes >= MONITORING_CONFIG.MAX_PROCTORING_STRIKES) {
      isAutoSubmitted = true;
      this.logger.error(`Candidate ${candidateId} exceeded max proctoring strikes (${currentStrikes}). Auto-submitting.`, {
        attemptId,
      });

      // Auto-submit attempt. Shares a distributed lock with SubmissionService
      // and AttemptRecoveryService's force-submit so a manual submit racing
      // this strike-triggered one can never both insert an isCurrent row.
      const lockKey = `submission-create:${attemptId}`;
      const lockAcquired = await this.cacheService.acquireLock(lockKey, 30);
      if (!lockAcquired) {
        this.logger.warn("Another submission is already being created for this attempt; skipping strike auto-submit", {
          attemptId,
        });
        return { strikeCount: currentStrikes, isAutoSubmitted: false };
      }

      try {
        const { submission, answersMap } = await this.prisma.$transaction(async (tx) => {
          await tx.testInstance.update({
            where: { id: attemptId },
            data: {
              status: "AUTO_SUBMITTED",
              submittedAt: new Date(),
            },
          });

          const existingCount = await tx.submission.count({
            where: { testInstanceId: attemptId },
          });
          if (existingCount > 0) {
            await tx.submission.updateMany({
              where: { testInstanceId: attemptId, isCurrent: true },
              data: { isCurrent: false },
            });
          }

          const submission = await tx.submission.create({
            data: {
              testInstanceId: attemptId,
              status: "AUTO_SUBMITTED",
              source: "RULE_ENGINE",
              reason: "PROCTORING_LIMIT",
              reasonDetails: `Max proctoring strikes exceeded (${currentStrikes}/${MONITORING_CONFIG.MAX_PROCTORING_STRIKES}): ${dto.eventType}`,
              isAutoSubmit: true,
              attemptSequence: existingCount + 1,
              isCurrent: true,
              submittedAt: new Date(),
            },
          });

          const answers = await tx.candidateAnswer.findMany({ where: { testInstanceId: attemptId } });
          const answersMap: Record<string, string> = {};
          for (const a of answers) {
            answersMap[a.questionId] =
              typeof a.answer === "string" ? a.answer : JSON.stringify(a.answer ?? "");
          }

          return { submission, answersMap };
        });

        await this.monitoringService.transitionCandidateState(
          assessmentId,
          attemptId,
          "AUTO_SUBMITTED",
          undefined,
          "RULE_ENGINE",
          `Proctoring limit exceeded (${currentStrikes} strikes)`,
        );

        try {
          await this.evaluationQueueService.enqueueSubmission(
            submission.id,
            attemptId,
            candidateId,
            answersMap,
          );
        } catch (err) {
          this.logger.error("Failed enqueuing strike-triggered auto-submission for evaluation", err, {
            attemptId,
            submissionId: submission.id,
          });
        }

        await this.alertService.emitAlert({
          assessmentId,
          attemptId,
          candidateId,
          candidateName: liveRecord.candidateName,
          severity: "P1",
          category: "PROCTORING",
          title: "Candidate Auto-Submitted: Proctoring Violations",
          message: `Candidate ${liveRecord.candidateName || candidateId} exceeded max proctoring strikes (${currentStrikes}/${MONITORING_CONFIG.MAX_PROCTORING_STRIKES}) and was auto-submitted.`,
          metadata: { strikes: currentStrikes, finalViolation: dto.eventType },
        });
      } finally {
        await this.cacheService.releaseLock(lockKey);
      }
    } else {
      // Update strikes in live record and persist immediately — otherwise the
      // next violation recomputes from this same stale count and strikes never advance.
      liveRecord.proctoringStrikes = currentStrikes;
      if (currentStrikes >= MONITORING_CONFIG.HIGH_STRIKE_THRESHOLD) {
        liveRecord.isNeedsAttention = true;
        if (!liveRecord.incidentReasons.includes(`High Strikes (${currentStrikes})`)) {
          liveRecord.incidentReasons.push(`High Strikes (${currentStrikes})`);
        }
      }

      if (this.isRedisAvailable()) {
        try {
          const redis = RedisConnectionManager.getInstance();
          await redis.set(
            REDIS_KEYS.attemptState(assessmentId, attemptId),
            JSON.stringify(liveRecord),
            "EX",
            MONITORING_CONFIG.REDIS_STATE_TTL_SECONDS,
          );
        } catch (err) {
          this.logger.warn("Failed persisting incremented proctoring strikes to Redis", { error: err });
        }
      }

      if (currentStrikes >= MONITORING_CONFIG.HIGH_STRIKE_THRESHOLD) {
        await this.alertService.emitAlert({
          assessmentId,
          attemptId,
          candidateId,
          candidateName: liveRecord.candidateName,
          severity: "P2",
          category: "PROCTORING",
          title: "Proctoring Warning Threshold Exceeded",
          message: `Candidate ${liveRecord.candidateName || candidateId} accumulated ${currentStrikes} proctoring strikes (${dto.eventType}).`,
          metadata: { strikes: currentStrikes },
        });
      }
    }

    return { strikeCount: currentStrikes, isAutoSubmitted };
  }
}
