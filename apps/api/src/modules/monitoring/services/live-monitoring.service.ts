import { Injectable, OnModuleInit, OnModuleDestroy, NotFoundException, BadRequestException } from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";
import { PrismaService } from "../../../prisma/prisma.service";
import { RedisConnectionManager } from "../../../cache/redis-connection.manager";
import { LiveAlertService } from "./live-alert.service";
import { SystemHealthService } from "./system-health.service";
import {
  MONITORING_CONFIG,
  REDIS_KEYS,
  CandidateLiveState,
  VALID_STATE_TRANSITIONS,
  TEST_INSTANCE_STATUS_TO_LIVE_STATE,
} from "../constants/monitoring.constants";
import { CandidateHeartbeatDto, QueryCandidatesDto } from "../dto/monitoring.dto";

export interface CandidateLiveRecord {
  assessmentId: string;
  attemptId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidateRole?: string;
  status: CandidateLiveState;
  currentSectionKey: string;
  currentSectionIndex: number;
  currentQuestionId: string;
  currentQuestionIndex: number;
  answeredCount: number;
  totalQuestions: number;
  markedQuestionsCount: number;
  remainingTimeSeconds: number;
  expiresAt?: string;
  lastHeartbeatAt: number;
  lastStateSyncAt: number;
  latencyMs: number;
  networkStatus: string;
  autosaveHealth: string;
  unsyncedAnswersCount: number;
  proctoringStrikes: number;
  isNeedsAttention: boolean;
  incidentReasons: string[];
  submissionSource?: string;
  submissionReason?: string;
  extraTimeGrantedSeconds?: number;
}

@Injectable()
export class LiveMonitoringService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new AppLogger({ name: "LiveMonitoringService" });
  private watchdogInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertService: LiveAlertService,
    private readonly systemHealthService: SystemHealthService,
  ) {}

  onModuleInit() {
    // Start watchdog every 10 seconds to detect disconnected/silent candidates
    this.watchdogInterval = setInterval(() => {
      this.runWatchdogAudit().catch((err) => {
        this.logger.error("Watchdog audit cycle encountered error", err);
      });
    }, MONITORING_CONFIG.HEARTBEAT_INTERVAL_MS);
    this.logger.info("Live Monitoring watchdog service initialized (interval: 10s)");
  }

  onModuleDestroy() {
    if (this.watchdogInterval) {
      clearInterval(this.watchdogInterval);
      this.watchdogInterval = null;
    }
  }

  private isRedisAvailable(): boolean {
    return RedisConnectionManager.isConnected();
  }

  /**
   * Helper to retrieve cached attempt metadata (userId and assessmentId).
   * Resolves in O(1) from Redis with zero database query overhead during live exams.
   */
  async getAttemptMetadata(attemptId: string): Promise<{ userId: string; assessmentId: string }> {
    if (this.isRedisAvailable()) {
      try {
        const redis = RedisConnectionManager.getInstance();
        const cached = await redis.get(REDIS_KEYS.attemptMetadata(attemptId));
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (err) {
        this.logger.warn(`Failed reading attempt metadata cache for ${attemptId}`, err);
      }
    }

    // Cache miss: query database once
    let userId = "";
    let assessmentId = "default-assessment";

    if (this.prisma?.testInstance?.findUnique) {
      const attempt = await this.prisma.testInstance.findUnique({
        where: { id: attemptId },
        select: { userId: true, testConfigId: true, examConfigId: true },
      });
      if (attempt) {
        userId = attempt.userId || "";
        assessmentId = (attempt as any)?.examConfigId || attempt?.testConfigId || "default-assessment";
      }
    }

    const metadata = { userId, assessmentId };

    if (this.isRedisAvailable() && metadata.userId) {
      try {
        const redis = RedisConnectionManager.getInstance();
        await redis.set(
          REDIS_KEYS.attemptMetadata(attemptId),
          JSON.stringify(metadata),
          "EX",
          MONITORING_CONFIG.ATTEMPT_METADATA_TTL_SECONDS,
        );
      } catch (err) {
        this.logger.warn(`Failed caching attempt metadata for ${attemptId}`, err);
      }
    }

    return metadata;
  }

  /**
   * Helper to resolve assessment ID from attempt metadata cache
   */
  async resolveAssessmentId(attemptId: string): Promise<string> {
    const meta = await this.getAttemptMetadata(attemptId);
    return meta.assessmentId || "default-assessment";
  }

  /**
   * Ingests high-frequency candidate heartbeat into Redis.
   * Completely off the critical execution path.
   */
  async recordHeartbeat(
    attemptId: string,
    candidateId: string,
    dto: CandidateHeartbeatDto,
  ): Promise<{
    serverTimestamp: string;
    status: CandidateLiveState;
    remainingTimeSeconds?: number;
    expiresAt?: string;
    extraTimeGrantedSeconds?: number;
    directive?: string;
  }> {
    const now = Date.now();
    const assessmentId = await this.resolveAssessmentId(attemptId);

    // 1. Fetch existing live state from Redis or hydrate from DB
    let record = await this.getCandidateLiveRecord(assessmentId, attemptId);
    if (!record) {
      record = await this.hydrateLiveRecordFromDb(attemptId, candidateId, assessmentId);
    }

    // 2. Validate / Update State
    let newStatus: CandidateLiveState = record.status;
    if (newStatus === "DISCONNECTED" || newStatus === "RECONNECTING") {
      newStatus = "ACTIVE";
      // Candidate recovered
      this.logger.info(`Candidate ${candidateId} recovered to ACTIVE`, { attemptId });
    }

    // 3. Evaluate Needs Attention criteria
    const incidentReasons: string[] = [];
    let isNeedsAttention = false;

    if (
      dto.autosaveHealth === "FAILED" &&
      record.candidateRole !== "ADMIN" &&
      record.candidateRole !== "PLAN_MANAGER"
    ) {
      isNeedsAttention = true;
      incidentReasons.push("Autosave Failure");
      await this.alertService.emitAlert({
        assessmentId,
        attemptId,
        candidateId,
        candidateName: record.candidateName,
        candidateRole: record.candidateRole,
        severity: "P1",
        category: "AUTOSAVE",
        title: "Candidate Autosave Failed",
        message: `Candidate ${record.candidateName} (${record.candidateEmail}) is experiencing persistent autosave failures.`,
      });
    }

    if (dto.latencyMs && dto.latencyMs > MONITORING_CONFIG.SLOW_LATENCY_THRESHOLD_MS) {
      incidentReasons.push(`High Latency (${dto.latencyMs}ms)`);
      if (dto.latencyMs > 1200) isNeedsAttention = true;
    }

    if (record.proctoringStrikes >= MONITORING_CONFIG.HIGH_STRIKE_THRESHOLD) {
      isNeedsAttention = true;
      incidentReasons.push(`High Proctoring Strikes (${record.proctoringStrikes}/${MONITORING_CONFIG.MAX_PROCTORING_STRIKES})`);
    }

    if (newStatus === "AUTO_SUBMITTED" || newStatus === "ADMIN_REVIEW") {
      isNeedsAttention = true;
      incidentReasons.push("Awaiting Admin Review");
    }

    // Server-Authoritative Timer Recalculation
    let authoritativeRemainingSeconds = record.remainingTimeSeconds;
    if (record.expiresAt) {
      const expiresAtMs = new Date(record.expiresAt).getTime();
      authoritativeRemainingSeconds = Math.max(0, Math.floor((expiresAtMs - now) / 1000));
    }

    // Authoritative Server-Side Timeout Detection
    if (authoritativeRemainingSeconds <= 0 && (newStatus === "ACTIVE" || newStatus === "STARTING")) {
      newStatus = "AUTO_SUBMITTED";
      isNeedsAttention = true;
      if (!incidentReasons.includes("Time Expired")) {
        incidentReasons.push("Time Expired");
      }
      this.logger.warn(`Server timer expired for attempt ${attemptId}, triggering authoritative auto-submission`, {
        attemptId,
        candidateId,
        expiresAt: record.expiresAt,
      });

      this.transitionCandidateState(
        assessmentId,
        attemptId,
        "AUTO_SUBMITTED",
        "SYSTEM",
        "TIMEOUT",
        "Assessment timer expired on server",
        { timeoutAt: new Date().toISOString() },
      ).catch((err) => {
        this.logger.error("Failed auto-submitting expired attempt", err);
      });
    }

    // 4. Update the live record
    record = {
      ...record,
      status: newStatus,
      currentSectionKey: dto.currentSectionKey ?? record.currentSectionKey,
      currentSectionIndex: dto.currentSectionIndex ?? record.currentSectionIndex,
      currentQuestionId: dto.currentQuestionId ?? record.currentQuestionId,
      currentQuestionIndex: dto.currentQuestionIndex ?? record.currentQuestionIndex,
      answeredCount: dto.answeredCount ?? record.answeredCount,
      totalQuestions: dto.totalQuestions ?? record.totalQuestions,
      markedQuestionsCount: dto.markedQuestionsCount ?? record.markedQuestionsCount,
      remainingTimeSeconds: authoritativeRemainingSeconds,
      lastHeartbeatAt: now,
      latencyMs: dto.latencyMs ?? record.latencyMs,
      networkStatus: dto.networkStatus ?? "ONLINE",
      autosaveHealth: dto.autosaveHealth ?? "HEALTHY",
      unsyncedAnswersCount: dto.unsyncedAnswersCount ?? 0,
      // Strikes are server-authoritative and only ever mutated by
      // ProctoringMonitoringService.handleProctoringEvent — never trust the
      // client's heartbeat payload here, or a routine heartbeat can wipe out
      // real violations recorded moments earlier.
      proctoringStrikes: record.proctoringStrikes,
      isNeedsAttention,
      incidentReasons,
    };

    // 5. Save in Redis and publish delta
    if (this.isRedisAvailable()) {
      try {
        const redis = RedisConnectionManager.getInstance();
        const stateKey = REDIS_KEYS.attemptState(assessmentId, attemptId);
        await redis.set(
          stateKey,
          JSON.stringify(record),
          "EX",
          MONITORING_CONFIG.REDIS_STATE_TTL_SECONDS,
        );

        // Only add to active set and publish live delta if NOT an ADMIN or PLAN_MANAGER
        if (record.candidateRole !== "ADMIN" && record.candidateRole !== "PLAN_MANAGER") {
          // Add to active set and active assessments index
          await redis.sadd(REDIS_KEYS.assessmentActiveSet(assessmentId), attemptId);
          await redis.sadd(REDIS_KEYS.activeAssessmentsIndex(), assessmentId);

          // Publish live update delta
          await redis.publish(
            REDIS_KEYS.assessmentEventsChannel(assessmentId),
            JSON.stringify({
              type: "CANDIDATE_HEARTBEAT",
              payload: {
                attemptId,
                candidateId,
                candidateRole: record.candidateRole,
                status: record.status,
                currentSectionKey: record.currentSectionKey,
                currentQuestionIndex: record.currentQuestionIndex,
                answeredCount: record.answeredCount,
                remainingTimeSeconds: record.remainingTimeSeconds,
                latencyMs: record.latencyMs,
                autosaveHealth: record.autosaveHealth,
                networkStatus: record.networkStatus,
                isNeedsAttention: record.isNeedsAttention,
                lastHeartbeatAt: now,
              },
              timestamp: new Date().toISOString(),
            }),
          );
        }
      } catch (err) {
        this.logger.warn("Failed caching heartbeat to Redis", { error: err });
      }
    }

    return {
      serverTimestamp: new Date(now).toISOString(),
      status: record.status,
      remainingTimeSeconds: authoritativeRemainingSeconds,
      expiresAt: record.expiresAt,
      extraTimeGrantedSeconds: record.extraTimeGrantedSeconds,
      directive:
        record.status === "RESUME_AUTHORIZED"
          ? "RESUME_SESSION"
          : authoritativeRemainingSeconds <= 0
            ? "FORCE_SUBMIT"
            : undefined,
    };
  }

  /**
   * Safely transitions candidate state following the state machine
   */
  async transitionCandidateState(
    assessmentId: string,
    attemptId: string,
    targetState: CandidateLiveState,
    actorId?: string,
    actorRole = "SYSTEM",
    reason?: string,
    metadata?: any,
  ): Promise<CandidateLiveRecord> {
    let record = await this.getCandidateLiveRecord(assessmentId, attemptId);
    if (!record) {
      const attempt = await this.prisma.testInstance.findUnique({
        where: { id: attemptId },
        include: { user: true },
      });
      if (!attempt) throw new NotFoundException(`Attempt ${attemptId} not found`);
      record = await this.hydrateLiveRecordFromDb(attemptId, attempt.userId, assessmentId);
    }

    const currentState = record.status;
    const allowed = VALID_STATE_TRANSITIONS[currentState] || [];
    if (!allowed.includes(targetState) && currentState !== targetState) {
      throw new BadRequestException(
        `Invalid state transition from ${currentState} to ${targetState}. Allowed: [${allowed.join(", ")}]`,
      );
    }

    record.status = targetState;
    if (targetState === "AUTO_SUBMITTED" || targetState === "ADMIN_REVIEW") {
      record.isNeedsAttention = true;
      if (reason && !record.incidentReasons.includes(reason)) {
        record.incidentReasons.push(reason);
      }
    } else if (targetState === "ACTIVE" || targetState === "COMPLETED") {
      record.isNeedsAttention = false;
      record.incidentReasons = [];
    }

    // Persist to DB if state is durable
    if (
      ["SUBMITTED", "AUTO_SUBMITTED", "COMPLETED", "TERMINATED", "ADMIN_REVIEW", "RESUME_AUTHORIZED", "RESUMED", "IN_PROGRESS"].includes(
        targetState,
      )
    ) {
      const dbStatusMap: Record<string, any> = {
        ACTIVE: "IN_PROGRESS",
        RESUMED: "IN_PROGRESS",
      };
      const dbStatus = dbStatusMap[targetState] || targetState;

      await this.prisma.testInstance.update({
        where: { id: attemptId },
        data: { status: dbStatus as any },
      });

      // Write immutable audit log
      await this.prisma.assessmentAuditLog.create({
        data: {
          attemptId,
          candidateId: record.candidateId,
          assessmentId,
          eventType: `STATE_TRANSITION_${targetState}`,
          source: actorRole,
          actorId,
          actorRole,
          metadata: { previousState: currentState, targetState, reason, ...metadata },
        },
      });

      await this.prisma.assessmentEvent.create({
        data: {
          assessmentId,
          attemptId,
          candidateId: record.candidateId,
          eventType: `STATE_TRANSITION`,
          source: actorRole,
          severity: targetState === "AUTO_SUBMITTED" ? "P1" : "P3",
          metadata: { previousState: currentState, targetState, reason },
        },
      });
    }

    // Update Redis
    if (this.isRedisAvailable()) {
      try {
        const redis = RedisConnectionManager.getInstance();
        await redis.set(
          REDIS_KEYS.attemptState(assessmentId, attemptId),
          JSON.stringify(record),
          "EX",
          MONITORING_CONFIG.REDIS_STATE_TTL_SECONDS,
        );

        if (record.candidateRole !== "ADMIN" && record.candidateRole !== "PLAN_MANAGER") {
          await redis.publish(
            REDIS_KEYS.assessmentEventsChannel(assessmentId),
            JSON.stringify({
              type: "STATE_TRANSITION",
              payload: {
                attemptId,
                candidateId: record.candidateId,
                candidateRole: record.candidateRole,
                previousState: currentState,
                newState: targetState,
                reason,
              },
              timestamp: new Date().toISOString(),
            }),
          );
        }
      } catch (err) {
        this.logger.warn("Failed updating Redis state on transition", { error: err });
      }
    }

    return record;
  }

  /**
   * Watchdog cycle: Scans active attempts, detects disconnects and prolonged outages.
   */
  async runWatchdogAudit(): Promise<void> {
    if (!this.isRedisAvailable()) return;

    try {
      const redis = RedisConnectionManager.getInstance();
      let assessmentIds = await redis.smembers(REDIS_KEYS.activeAssessmentsIndex());

      // If active assessments index is empty in Redis, hydrate from active sets or DB
      if (!assessmentIds || assessmentIds.length === 0) {
        if (typeof (redis as any).keys === "function") {
          const keys = await (redis as any).keys("assessment:*:active_attempts");
          if (keys && keys.length > 0) {
            assessmentIds = keys
              .map((k: string) => {
                const match = k.match(/^assessment:(.+):active_attempts$/);
                return match ? match[1] : null;
              })
              .filter((id: string | null): id is string => Boolean(id));
            if (assessmentIds.length > 0) {
              await redis.sadd(REDIS_KEYS.activeAssessmentsIndex(), ...assessmentIds);
            }
          }
        }

        if ((!assessmentIds || assessmentIds.length === 0) && typeof this.prisma?.testInstance?.findMany === "function") {
          const activeDbAttempts = await this.prisma.testInstance.findMany({
            where: {
              status: { in: ["IN_PROGRESS", "ACTIVE", "STARTING"] as any },
            },
            select: { examConfigId: true, testConfigId: true },
            distinct: ["examConfigId", "testConfigId"],
            take: 50,
          });
          const discovered = new Set<string>();
          for (const a of activeDbAttempts) {
            const id = a.examConfigId || a.testConfigId;
            if (id) discovered.add(id);
          }
          if (discovered.size > 0) {
            assessmentIds = Array.from(discovered);
            await redis.sadd(REDIS_KEYS.activeAssessmentsIndex(), ...assessmentIds);
          }
        }
      }

      const now = Date.now();

      for (const assessmentId of assessmentIds) {
        const key = REDIS_KEYS.assessmentActiveSet(assessmentId);
        const attemptIds = await redis.smembers(key);

        if (!attemptIds || attemptIds.length === 0) {
          // No active attempts in this assessment set; clean up index
          await redis.srem(REDIS_KEYS.activeAssessmentsIndex(), assessmentId);
          continue;
        }

        let activeCount = 0;
        let disconnectedCount = 0;

        for (const attemptId of attemptIds) {
          const rawRecord = await redis.get(REDIS_KEYS.attemptState(assessmentId, attemptId));
          if (!rawRecord) {
            // Attempt expired from live state
            await redis.srem(key, attemptId);
            continue;
          }

          const record: CandidateLiveRecord = JSON.parse(rawRecord);
          if (record.candidateRole === "ADMIN" || record.candidateRole === "PLAN_MANAGER") {
            await redis.srem(key, attemptId);
            continue;
          }
          const silentDuration = now - (record.lastHeartbeatAt || 0);

          if (record.status === "ACTIVE" && silentDuration > MONITORING_CONFIG.HEARTBEAT_DISCONNECT_THRESHOLD_MS) {
            // Silent for > 30s -> DISCONNECTED
            record.status = "DISCONNECTED";
            record.networkStatus = "OFFLINE";
            record.isNeedsAttention = true;
            if (!record.incidentReasons.includes("Disconnected (>30s)")) {
              record.incidentReasons.push("Disconnected (>30s)");
            }

            await redis.set(
              REDIS_KEYS.attemptState(assessmentId, attemptId),
              JSON.stringify(record),
              "EX",
              MONITORING_CONFIG.REDIS_STATE_TTL_SECONDS,
            );

            await redis.publish(
              REDIS_KEYS.assessmentEventsChannel(assessmentId),
              JSON.stringify({
                type: "CANDIDATE_DISCONNECTED",
                payload: {
                  attemptId,
                  candidateId: record.candidateId,
                  candidateName: record.candidateName,
                  silentDurationSeconds: Math.floor(silentDuration / 1000),
                },
                timestamp: new Date().toISOString(),
              }),
            );

            await this.alertService.emitAlert({
              assessmentId,
              attemptId,
              candidateId: record.candidateId,
              candidateName: record.candidateName,
              severity: "P2",
              category: "DISCONNECT",
              title: "Candidate Disconnected",
              message: `Candidate ${record.candidateName} (${record.candidateEmail}) has stopped sending heartbeats (${Math.floor(silentDuration / 1000)}s silent).`,
            });

            disconnectedCount++;
          } else if (record.status === "DISCONNECTED" && silentDuration > MONITORING_CONFIG.PROLONGED_DISCONNECT_THRESHOLD_MS) {
            // Silent for > 90s -> Prolonged Disconnect Critical
            if (!record.incidentReasons.includes("Prolonged Disconnect (>90s)")) {
              record.incidentReasons.push("Prolonged Disconnect (>90s)");
              await redis.set(
                REDIS_KEYS.attemptState(assessmentId, attemptId),
                JSON.stringify(record),
                "EX",
                MONITORING_CONFIG.REDIS_STATE_TTL_SECONDS,
              );

              await this.alertService.emitAlert({
                assessmentId,
                attemptId,
                candidateId: record.candidateId,
                candidateName: record.candidateName,
                severity: "P1",
                category: "DISCONNECT",
                title: "Prolonged Candidate Disconnect",
                message: `Candidate ${record.candidateName} has been disconnected for > ${Math.floor(silentDuration / 1000)}s. May require intervention or recovery.`,
              });
            }
          }

          if (record.status === "ACTIVE") {
            activeCount++;
          }
        }

        if (disconnectedCount > 0 && activeCount + disconnectedCount >= 10) {
          await this.systemHealthService.trackCandidateDisconnect(
            assessmentId,
            activeCount + disconnectedCount,
          );
        }
      }
    } catch (err) {
      this.logger.error("Error executing watchdog audit cycle", err);
    }
  }

  /**
   * Retrieves candidate live record from Redis
   */
  async getCandidateLiveRecord(
    assessmentId: string,
    attemptId: string,
  ): Promise<CandidateLiveRecord | null> {
    if (this.isRedisAvailable()) {
      try {
        const redis = RedisConnectionManager.getInstance();
        const raw = await redis.get(REDIS_KEYS.attemptState(assessmentId, attemptId));
        if (raw) return JSON.parse(raw);
      } catch (err) {
        this.logger.warn("Redis get error for live candidate state", { error: err });
      }
    }
    return null;
  }

  /**
   * Hydrates candidate live record from DB if missing in Redis
   */
  async hydrateLiveRecordFromDb(
    attemptId: string,
    candidateId: string,
    assessmentId: string,
  ): Promise<CandidateLiveRecord> {
    const [attempt, executionState, answersCount, user] = await Promise.all([
      this.prisma.testInstance.findUnique({
        where: { id: attemptId },
        select: {
          status: true,
          expiresAt: true,
          startedAt: true,
          questions: { select: { id: true } },
          submissions: {
            select: { source: true, reason: true, isAutoSubmit: true, attemptSequence: true, isCurrent: true },
            orderBy: { attemptSequence: "desc" },
            take: 1,
          },
        },
      }),
      this.prisma.executionState.findUnique({
        where: { testInstanceId: attemptId },
      }),
      this.prisma.candidateAnswer.count({
        where: { testInstanceId: attemptId },
      }),
      this.prisma.user.findUnique({
        where: { id: candidateId },
        select: { fullName: true, email: true, role: true },
      }),
    ]);

    const totalQuestions = attempt?.questions?.length || 0;
    let remainingTime = 3600;
    if (attempt?.expiresAt) {
      remainingTime = Math.max(0, Math.floor((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000));
    }

    const status: CandidateLiveState =
      TEST_INSTANCE_STATUS_TO_LIVE_STATE[attempt?.status || "CREATED"] || "ACTIVE";
    const latestSubmission = attempt?.submissions?.[0];

    return {
      assessmentId,
      attemptId,
      candidateId,
      candidateName: user?.fullName || "Candidate",
      candidateEmail: user?.email || "candidate@intervu.ai",
      candidateRole: (user as any)?.role || "CANDIDATE",
      status,
      currentSectionKey: executionState?.currentSectionKey || "section-1",
      currentSectionIndex: executionState?.currentSectionIndex ?? 0,
      currentQuestionId: executionState?.currentQuestionId || "",
      currentQuestionIndex: executionState?.currentQuestionIndex ?? 0,
      answeredCount: answersCount,
      totalQuestions,
      markedQuestionsCount: 0,
      remainingTimeSeconds: remainingTime,
      expiresAt: attempt?.expiresAt?.toISOString(),
      lastHeartbeatAt: Date.now(),
      lastStateSyncAt: Date.now(),
      latencyMs: 35,
      networkStatus: "ONLINE",
      autosaveHealth: "HEALTHY",
      unsyncedAnswersCount: 0,
      proctoringStrikes: 0,
      isNeedsAttention: status === "AUTO_SUBMITTED" || status === "ADMIN_REVIEW",
      incidentReasons: status === "AUTO_SUBMITTED" ? ["Auto-submitted"] : [],
      submissionSource: latestSubmission?.source,
      submissionReason: latestSubmission?.reason,
    };
  }

  /**
   * Builds the comprehensive live assessment snapshot with server-side filtering/pagination
   */
  /**
   * Builds the comprehensive live assessment snapshot with server-side filtering/pagination
   */
  async getAssessmentLiveSnapshot(
    assessmentId: string,
    query: QueryCandidatesDto,
  ): Promise<any> {
    let candidateRecords: CandidateLiveRecord[] = [];
    const isAll = assessmentId === "all";

    // 0. Parse Date Filter Range
    let dateStart: Date | undefined;
    let dateEnd: Date | undefined;

    if (query.dateFilter === "today") {
      dateStart = new Date();
      dateStart.setHours(0, 0, 0, 0);
      dateEnd = new Date();
      dateEnd.setHours(23, 59, 59, 999);
    } else if (query.dateFilter === "yesterday") {
      dateStart = new Date();
      dateStart.setDate(dateStart.getDate() - 1);
      dateStart.setHours(0, 0, 0, 0);
      dateEnd = new Date();
      dateEnd.setDate(dateEnd.getDate() - 1);
      dateEnd.setHours(23, 59, 59, 999);
    } else if (query.dateFilter === "custom" && (query.startDate || query.endDate)) {
      if (query.startDate) {
        dateStart = new Date(query.startDate);
        if (query.startDate.length === 10) dateStart.setHours(0, 0, 0, 0);
      }
      if (query.endDate) {
        dateEnd = new Date(query.endDate);
        if (query.endDate.length === 10) dateEnd.setHours(23, 59, 59, 999);
      }
    }

    // 1. Fetch live records from Redis (Fast Path using MGET batching)
    const redisMap = new Map<string, CandidateLiveRecord>();
    if (this.isRedisAvailable()) {
      try {
        const redis = RedisConnectionManager.getInstance();
        let targetAssessmentIds = [assessmentId];
        if (isAll) {
          const indexed = await redis.smembers(REDIS_KEYS.activeAssessmentsIndex());
          targetAssessmentIds = indexed && indexed.length > 0 ? indexed : [];
        }

        for (const aId of targetAssessmentIds) {
          const activeIds = await redis.smembers(REDIS_KEYS.assessmentActiveSet(aId));
          if (activeIds && activeIds.length > 0) {
            const keys = activeIds.map((id) => REDIS_KEYS.attemptState(aId, id));
            const rawRecords =
              typeof (redis as any).mget === "function"
                ? await (redis as any).mget(...keys)
                : await Promise.all(keys.map((k: string) => redis.get(k)));

            for (const raw of rawRecords) {
              if (raw) {
                try {
                  const rec: CandidateLiveRecord = JSON.parse(raw);
                  redisMap.set(rec.attemptId, rec);
                } catch (_) {}
              }
            }
          }
        }
      } catch (err) {
        this.logger.warn("Failed retrieving active attempts from Redis", { error: err });
      }
    }

    // 2. Authoritative query of attempts from PostgreSQL (strictly excluding ADMIN and PLAN_MANAGER users)
    const whereClause: any = {
      user: {
        role: { notIn: ["ADMIN", "PLAN_MANAGER"] as any },
      },
    };
    if (!isAll) {
      whereClause.OR = [{ examConfigId: assessmentId }, { testConfigId: assessmentId }];
    }
    if (dateStart || dateEnd) {
      whereClause.createdAt = {};
      if (dateStart) whereClause.createdAt.gte = dateStart;
      if (dateEnd) whereClause.createdAt.lte = dateEnd;
    }

    const dbAttempts = await this.prisma.testInstance.findMany({
      where: whereClause,
      include: {
        user: { select: { fullName: true, email: true, role: true } },
        executionState: true,
        submissions: {
          select: { source: true, reason: true },
          orderBy: { attemptSequence: "desc" },
          take: 1,
        },
        questions: { select: { id: true } },
        _count: {
          select: { candidateAnswers: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Merge: overlay real-time Redis telemetry on DB attempts
    const now = Date.now();
    const seenAttemptIds = new Set<string>();

    candidateRecords = dbAttempts
      .filter((att) => {
        const role = (att.user as any)?.role;
        return role !== "ADMIN" && role !== "PLAN_MANAGER";
      })
      .map((att) => {
        seenAttemptIds.add(att.id);
        const live = redisMap.get(att.id);
        if (live) {
          return live;
        }

        // No heartbeat in Redis: compute status from authoritative DB state
        const answersCount =
          (att as any)._count?.candidateAnswers ??
          (att as any).candidateAnswers?.length ??
          0;

        let remTime = 3600;
        if (att.expiresAt) {
          remTime = Math.max(0, Math.floor((new Date(att.expiresAt).getTime() - now) / 1000));
        }

        let status: CandidateLiveState =
          TEST_INSTANCE_STATUS_TO_LIVE_STATE[att.status] || "ACTIVE";

        let networkStatus = "ONLINE";
        let isNeedsAttention = false;
        const incidentReasons: string[] = [];

        // If DB status is ACTIVE or IN_PROGRESS but heartbeat is absent in Redis, candidate is DISCONNECTED
        if (att.status === "IN_PROGRESS" || (att.status as any) === "ACTIVE") {
          status = "DISCONNECTED";
          networkStatus = "OFFLINE";
          isNeedsAttention = true;
          incidentReasons.push("Heartbeat Offline / Key Expired");
        } else if (att.status === "AUTO_SUBMITTED" || att.status === "ADMIN_REVIEW") {
          isNeedsAttention = true;
          incidentReasons.push(att.submissions?.[0]?.reason || "Auto-submitted");
        }

        return {
          assessmentId: isAll
            ? ((att as any)?.examConfigId || att?.testConfigId || "all")
            : assessmentId,
          attemptId: att.id,
          candidateId: att.userId,
          candidateName: att.user?.fullName || "Candidate",
          candidateEmail: att.user?.email || "candidate@intervu.ai",
          candidateRole: (att.user as any)?.role || "CANDIDATE",
          status,
        currentSectionKey: att.executionState?.currentSectionKey || "section-1",
        currentSectionIndex: att.executionState?.currentSectionIndex ?? 0,
        currentQuestionId: att.executionState?.currentQuestionId || "",
        currentQuestionIndex: att.executionState?.currentQuestionIndex ?? 0,
        answeredCount: answersCount,
        totalQuestions: att.questions.length || 20,
        markedQuestionsCount: 0,
        remainingTimeSeconds: remTime,
        expiresAt: att.expiresAt?.toISOString(),
        lastHeartbeatAt: att.executionState?.lastActivityAt
          ? new Date(att.executionState.lastActivityAt).getTime()
          : now - 60000,
        lastStateSyncAt: now - 60000,
        latencyMs: 0,
        networkStatus,
        autosaveHealth: "HEALTHY",
        unsyncedAnswersCount: 0,
        proctoringStrikes: 0,
        isNeedsAttention,
        incidentReasons,
        submissionSource: att.submissions?.[0]?.source,
        submissionReason: att.submissions?.[0]?.reason,
      };
    });

    // Also include any active records in Redis that haven't flushed to DB yet
    // If a date filter is active, only include if their lastHeartbeatAt falls in range
    for (const [attemptId, liveRec] of redisMap.entries()) {
      if (!seenAttemptIds.has(attemptId)) {
        if (liveRec.candidateRole === "ADMIN" || liveRec.candidateRole === "PLAN_MANAGER") continue;
        if (dateStart && liveRec.lastHeartbeatAt < dateStart.getTime()) continue;
        if (dateEnd && liveRec.lastHeartbeatAt > dateEnd.getTime()) continue;
        candidateRecords.push(liveRec);
      }
    }

    // Final safety filter: strictly exclude ADMIN and PLAN_MANAGER users from live monitoring
    candidateRecords = candidateRecords.filter(
      (c) => c.candidateRole !== "ADMIN" && c.candidateRole !== "PLAN_MANAGER",
    );

    // 3. Compute Aggregated Summary Metrics across all candidates
    const total = candidateRecords.length;
    let active = 0;
    let disconnected = 0;
    let reconnecting = 0;
    let submitting = 0;
    let autoSubmitted = 0;
    let submitted = 0;
    let completed = 0;
    let terminated = 0;
    let needsAttentionCount = 0;
    let totalLatency = 0;
    let healthyAutosaveCount = 0;

    for (const c of candidateRecords) {
      if (c.status === "ACTIVE") active++;
      else if (c.status === "DISCONNECTED") disconnected++;
      else if (c.status === "RECONNECTING") reconnecting++;
      else if (c.status === "SUBMITTING") submitting++;
      else if (c.status === "AUTO_SUBMITTED") autoSubmitted++;
      else if (c.status === "SUBMITTED") submitted++;
      else if (c.status === "COMPLETED") completed++;
      else if (c.status === "TERMINATED") terminated++;

      if (c.isNeedsAttention) needsAttentionCount++;
      totalLatency += c.latencyMs || 0;
      if (c.autosaveHealth === "HEALTHY") healthyAutosaveCount++;
    }

    const avgLatencyMs = total > 0 ? Math.round(totalLatency / total) : 0;
    const autosaveHealthPercentage = total > 0 ? Math.round((healthyAutosaveCount / total) * 100) : 100;

    // 4. Server-Side Filtering
    let filtered = [...candidateRecords];

    if (query.search) {
      const q = query.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.candidateName.toLowerCase().includes(q) ||
          c.candidateEmail.toLowerCase().includes(q) ||
          c.attemptId.toLowerCase().includes(q),
      );
    }

    if (query.status && query.status !== "ALL") {
      filtered = filtered.filter((c) => c.status === query.status);
    }

    if (query.section) {
      filtered = filtered.filter((c) => c.currentSectionKey === query.section);
    }

    if (query.attentionOnly) {
      filtered = filtered.filter((c) => c.isNeedsAttention);
    }

    // 5. Sorting
    const sortField = query.sortBy || "remainingTime";
    const sortOrder = query.sortOrder || "asc";
    filtered.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;
      if (sortField === "remainingTime") {
        valA = a.remainingTimeSeconds;
        valB = b.remainingTimeSeconds;
      } else if (sortField === "latency") {
        valA = a.latencyMs;
        valB = b.latencyMs;
      } else if (sortField === "progress") {
        valA = a.totalQuestions > 0 ? a.answeredCount / a.totalQuestions : 0;
        valB = b.totalQuestions > 0 ? b.answeredCount / b.totalQuestions : 0;
      } else if (sortField === "strikes") {
        valA = a.proctoringStrikes;
        valB = b.proctoringStrikes;
      } else if (sortField === "name") {
        return sortOrder === "asc"
          ? a.candidateName.localeCompare(b.candidateName)
          : b.candidateName.localeCompare(a.candidateName);
      }

      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    // 6. Pagination
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 50;
    const paginatedItems = filtered.slice((page - 1) * limit, page * limit);

    // 7. Get alerts and system health
    const [alerts, platformHealth] = await Promise.all([
      this.alertService.getActiveAlerts(assessmentId),
      this.systemHealthService.getPlatformHealth(),
    ]);

    return {
      assessmentId,
      serverTime: new Date().toISOString(),
      dateFilter: query.dateFilter || "all",
      dateRange: {
        start: dateStart?.toISOString(),
        end: dateEnd?.toISOString(),
      },
      summary: {
        total,
        active,
        disconnected,
        reconnecting,
        submitting,
        autoSubmitted,
        submitted,
        completed,
        terminated,
        needsAttentionCount,
        avgLatencyMs,
        autosaveHealthPercentage,
      },
      pagination: {
        page,
        limit,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
      },
      candidates: paginatedItems,
      alerts,
      systemHealth: platformHealth,
    };
  }

  /**
   * Retrieves candidate detail for the 9-tab inspection drawer
   */
  async getCandidateDetail(assessmentId: string, attemptId: string): Promise<any> {
    const [liveRecord, attempt, answers, auditLogs, events, recoveryLogs] = await Promise.all([
      this.getCandidateLiveRecord(assessmentId, attemptId),
      this.prisma.testInstance.findUnique({
        where: { id: attemptId },
        include: {
          user: true,
          executionState: true,
          submissions: { orderBy: { attemptSequence: "desc" } },
          sections: { include: { questions: true } },
        },
      }),
      this.prisma.candidateAnswer.findMany({
        where: { testInstanceId: attemptId },
        orderBy: { savedAt: "asc" },
      }),
      this.prisma.assessmentAuditLog.findMany({
        where: { attemptId },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      this.prisma.assessmentEvent.findMany({
        where: { attemptId },
        orderBy: { timestamp: "desc" },
        take: 100,
      }),
      this.prisma.attemptRecoveryLog.findMany({
        where: { attemptId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!attempt || attempt.user?.role === "ADMIN" || attempt.user?.role === "PLAN_MANAGER") {
      throw new NotFoundException(`Attempt ${attemptId} not found`);
    }

    return {
      attemptId,
      assessmentId,
      candidate: {
        id: attempt.userId,
        name: attempt.user.fullName || "Candidate",
        email: attempt.user.email,
        college: attempt.user.college,
      },
      liveState: liveRecord || {
        status: attempt.status,
        remainingTimeSeconds: 0,
        latencyMs: 0,
        autosaveHealth: "HEALTHY",
      },
      testInstance: {
        id: attempt.id,
        status: attempt.status,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
        submittedAt: attempt.submittedAt,
        submission: attempt.submissions?.[0],
        submissions: attempt.submissions,
      },
      executionState: attempt.executionState,
      answers: answers.map((a) => ({
        questionId: a.questionId,
        answer: a.answer,
        timeSpentSeconds: a.timeSpentSeconds,
        isMarkedForReview: a.isMarkedForReview,
        savedAt: a.savedAt,
      })),
      sections: attempt.sections,
      auditTimeline: auditLogs,
      events,
      recoveryLogs,
    };
  }
}
