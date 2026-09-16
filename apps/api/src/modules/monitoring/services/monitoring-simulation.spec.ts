import { Test, TestingModule } from "@nestjs/testing";
import { LiveMonitoringService, CandidateLiveRecord } from "./live-monitoring.service";
import { AttemptRecoveryService } from "./attempt-recovery.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { LiveAlertService } from "./live-alert.service";
import { SystemHealthService } from "./system-health.service";
import { EvaluationQueueService } from "../../evaluation/services/evaluation-queue.service";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import { RedisConnectionManager } from "../../../cache/redis-connection.manager";
import { REDIS_KEYS, MONITORING_CONFIG } from "../constants/monitoring.constants";

describe("Monitoring High Concurrency Simulation (100+ Candidates)", () => {
  let monitoringService: LiveMonitoringService;
  let recoveryService: AttemptRecoveryService;
  let prismaMock: any;
  let alertServiceMock: any;
  let systemHealthServiceMock: any;
  let mockRedis: any;
  let redisStorage: Map<string, string>;
  let redisSets: Map<string, Set<string>>;
  let locksHeld: Set<string>;

  const CANDIDATE_COUNT = 100;
  const ASSESSMENT_ID = "assessment-stress-test-100";

  beforeEach(async () => {
    redisStorage = new Map();
    redisSets = new Map();
    locksHeld = new Set();

    mockRedis = {
      get: jest.fn().mockImplementation(async (key: string) => redisStorage.get(key) || null),
      set: jest.fn().mockImplementation(async (key: string, val: string, _mode?: string, _ttl?: number, flag?: string) => {
        if (flag === "NX") {
          if (locksHeld.has(key)) return null;
          locksHeld.add(key);
          return "OK";
        }
        redisStorage.set(key, val);
        return "OK";
      }),
      del: jest.fn().mockImplementation(async (key: string) => {
        locksHeld.delete(key);
        redisStorage.delete(key);
        return 1;
      }),
      sadd: jest.fn().mockImplementation(async (key: string, member: string) => {
        if (!redisSets.has(key)) redisSets.set(key, new Set());
        redisSets.get(key)!.add(member);
        return 1;
      }),
      srem: jest.fn().mockImplementation(async (key: string, member: string) => {
        if (redisSets.has(key)) redisSets.get(key)!.delete(member);
        return 1;
      }),
      smembers: jest.fn().mockImplementation(async (key: string) => {
        return Array.from(redisSets.get(key) || []);
      }),
      keys: jest.fn().mockImplementation(async (pattern: string) => {
        const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
        const matchingKeys: string[] = [];
        for (const k of Array.from(redisSets.keys()).concat(Array.from(redisStorage.keys()))) {
          if (regex.test(k) && !matchingKeys.includes(k)) {
            matchingKeys.push(k);
          }
        }
        return matchingKeys;
      }),
      publish: jest.fn().mockResolvedValue(1),
    };

    jest.spyOn(RedisConnectionManager, "isConnected").mockReturnValue(true);
    jest.spyOn(RedisConnectionManager, "getInstance").mockReturnValue(mockRedis as any);

    prismaMock = {
      testInstance: {
        findUnique: jest.fn().mockImplementation(async (args: any) => {
          const id = args.where.id;
          return {
            id,
            testConfigId: ASSESSMENT_ID,
            examConfigId: ASSESSMENT_ID,
            userId: `user-${id}`,
            status: "IN_PROGRESS",
            expiresAt: new Date(Date.now() + 3600000),
            user: { id: `user-${id}`, fullName: `Candidate ${id}`, email: `${id}@example.com` },
            executionState: {
              testInstanceId: id,
              remainingTimeSeconds: 2400,
              currentSectionKey: "coding-1",
              currentQuestionId: "q-1",
            },
            recoveryLogs: [],
          };
        }),
        update: jest.fn().mockResolvedValue({ id: "attempt-updated" }),
      },
      executionState: {
        findUnique: jest.fn().mockImplementation(async (args: any) => ({
          testInstanceId: args.where.testInstanceId,
          remainingTimeSeconds: 2400,
          currentSectionKey: "coding-1",
          currentQuestionId: "q-1",
          currentSectionIndex: 0,
          currentQuestionIndex: 0,
        })),
        update: jest.fn().mockResolvedValue({}),
      },
      candidateAnswer: {
        count: jest.fn().mockResolvedValue(4),
      },
      user: {
        findUnique: jest.fn().mockImplementation(async (args: any) => ({
          id: args.where.id,
          fullName: `Candidate ${args.where.id}`,
          email: `${args.where.id}@example.com`,
        })),
      },
      submission: {
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({ id: "sub-1" }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      attemptRecoveryLog: {
        create: jest.fn().mockResolvedValue({ id: "recov-log-1" }),
      },
      assessmentAuditLog: {
        create: jest.fn().mockResolvedValue({ id: "audit-1" }),
      },
      assessmentEvent: {
        create: jest.fn().mockResolvedValue({ id: "event-1" }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn().mockImplementation(async (cb: (tx: any) => Promise<any>) => cb(prismaMock)),
    };

    alertServiceMock = {
      emitAlert: jest.fn().mockResolvedValue({ id: "alert-1" }),
      createAlert: jest.fn().mockResolvedValue({ id: "alert-1" }),
    };

    systemHealthServiceMock = {
      getHealthSnapshot: jest.fn().mockResolvedValue({
        overallStatus: "HEALTHY",
        activeCandidates: CANDIDATE_COUNT,
        autosaveSuccessRate: 100,
        submissionSuccessRate: 100,
      }),
      trackCandidateDisconnect: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveMonitoringService,
        AttemptRecoveryService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: LiveAlertService, useValue: alertServiceMock },
        { provide: SystemHealthService, useValue: systemHealthServiceMock },
        { provide: EvaluationQueueService, useValue: { enqueueSubmission: jest.fn().mockResolvedValue(undefined) } },
        { provide: RedisCacheService, useValue: { acquireLock: jest.fn().mockResolvedValue(true), releaseLock: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    monitoringService = module.get<LiveMonitoringService>(LiveMonitoringService);
    recoveryService = module.get<AttemptRecoveryService>(AttemptRecoveryService);
  });

  afterEach(() => {
    monitoringService.onModuleDestroy();
    jest.clearAllMocks();
  });

  it("should handle 100 concurrent candidate heartbeats without data loss or race conditions", async () => {
    // Dispatch 100 concurrent heartbeats
    const heartbeatPromises = Array.from({ length: CANDIDATE_COUNT }, (_, i) => {
      const attemptId = `attempt-${i + 1}`;
      const candidateId = `user-${attemptId}`;

      return monitoringService.recordHeartbeat(attemptId, candidateId, {
        currentSectionKey: "algorithms",
        currentSectionIndex: 0,
        currentQuestionId: `q-${(i % 5) + 1}`,
        currentQuestionIndex: i % 5,
        answeredCount: (i % 8) + 1,
        totalQuestions: 15,
        markedQuestionsCount: 0,
        remainingTimeSeconds: 2000 - i * 5,
        latencyMs: 40 + (i % 20),
        networkStatus: "ONLINE",
        autosaveHealth: "HEALTHY",
        unsyncedAnswersCount: 0,
      });
    });

    const results = await Promise.all(heartbeatPromises);

    expect(results.length).toBe(CANDIDATE_COUNT);
    results.forEach((res) => {
      expect(res.status).toBe("ACTIVE");
      expect(res.serverTimestamp).toBeDefined();
    });

    // Verify all 100 are tracked in the Redis active set
    const activeAttempts = await mockRedis.smembers(REDIS_KEYS.assessmentActiveSet(ASSESSMENT_ID));
    expect(activeAttempts.length).toBe(CANDIDATE_COUNT);
  });

  it("should detect platform-wide disconnect storm when >= 10% of candidates disconnect in 60s", async () => {
    // Populate 100 active candidates
    const activeSetKey = REDIS_KEYS.assessmentActiveSet(ASSESSMENT_ID);
    const now = Date.now();
    const silentThresholdPassed = now - (MONITORING_CONFIG.HEARTBEAT_DISCONNECT_THRESHOLD_MS + 5000);

    // 15 candidates stop sending heartbeats (> 10% of 100)
    for (let i = 0; i < CANDIDATE_COUNT; i++) {
      const attemptId = `attempt-${i + 1}`;
      const isDisconnected = i < 15; // 15 disconnected
      const lastHeartbeat = isDisconnected ? silentThresholdPassed : now;

      const record: CandidateLiveRecord = {
        assessmentId: ASSESSMENT_ID,
        attemptId,
        candidateId: `user-${attemptId}`,
        candidateName: `Candidate ${i + 1}`,
        candidateEmail: `candidate${i + 1}@example.com`,
        status: "ACTIVE",
        currentSectionKey: "section-1",
        currentSectionIndex: 0,
        currentQuestionId: "q-1",
        currentQuestionIndex: 0,
        answeredCount: 3,
        totalQuestions: 10,
        markedQuestionsCount: 0,
        remainingTimeSeconds: 1500,
        lastHeartbeatAt: lastHeartbeat,
        lastStateSyncAt: lastHeartbeat,
        latencyMs: 50,
        networkStatus: "ONLINE",
        autosaveHealth: "HEALTHY",
        unsyncedAnswersCount: 0,
        proctoringStrikes: 0,
        isNeedsAttention: false,
        incidentReasons: [],
      };

      redisStorage.set(REDIS_KEYS.attemptState(ASSESSMENT_ID, attemptId), JSON.stringify(record));
      if (!redisSets.has(activeSetKey)) redisSets.set(activeSetKey, new Set());
      redisSets.get(activeSetKey)!.add(attemptId);
    }

    // Run watchdog audit
    await monitoringService.runWatchdogAudit();

    // Verify systemHealthService.trackCandidateDisconnect was triggered
    expect(systemHealthServiceMock.trackCandidateDisconnect).toHaveBeenCalledWith(
      ASSESSMENT_ID,
      CANDIDATE_COUNT,
    );

    // Verify the 15 candidates are now marked DISCONNECTED and needs attention
    for (let i = 0; i < 15; i++) {
      const attemptId = `attempt-${i + 1}`;
      const recordRaw = redisStorage.get(REDIS_KEYS.attemptState(ASSESSMENT_ID, attemptId));
      const record = JSON.parse(recordRaw!);
      expect(record.status).toBe("DISCONNECTED");
      expect(record.isNeedsAttention).toBe(true);
    }

    // Verify the remaining 85 candidates are still ACTIVE
    for (let i = 15; i < CANDIDATE_COUNT; i++) {
      const attemptId = `attempt-${i + 1}`;
      const recordRaw = redisStorage.get(REDIS_KEYS.attemptState(ASSESSMENT_ID, attemptId));
      const record = JSON.parse(recordRaw!);
      expect(record.status).toBe("ACTIVE");
    }
  });

  it("should orchestrate full end-to-end recovery: AUTO_SUBMITTED -> ADMIN_REVIEW -> RESUME_AUTHORIZED -> ACTIVE", async () => {
    const attemptId = "attempt-recovery-sim-1";
    const candidateId = `user-${attemptId}`;

    // 1. Candidate is AUTO_SUBMITTED
    prismaMock.testInstance.findUnique.mockResolvedValue({
      id: attemptId,
      status: "AUTO_SUBMITTED",
      userId: candidateId,
      testConfigId: ASSESSMENT_ID,
      examConfigId: ASSESSMENT_ID,
      user: { id: candidateId, fullName: "Recovering Candidate", email: "recov@test.com" },
      executionState: {
        remainingTimeSeconds: 400,
        currentSectionKey: "coding",
      },
      submission: { id: "sub-1", status: "SUBMITTED" },
      recoveryLogs: [],
    });

    const liveRecord: CandidateLiveRecord = {
      assessmentId: ASSESSMENT_ID,
      attemptId,
      candidateId,
      candidateName: "Recovering Candidate",
      candidateEmail: "recov@test.com",
      status: "AUTO_SUBMITTED",
      currentSectionKey: "coding",
      currentSectionIndex: 1,
      currentQuestionId: "q-2",
      currentQuestionIndex: 2,
      answeredCount: 4,
      totalQuestions: 10,
      markedQuestionsCount: 0,
      remainingTimeSeconds: 400,
      lastHeartbeatAt: Date.now(),
      lastStateSyncAt: Date.now(),
      latencyMs: 60,
      networkStatus: "ONLINE",
      autosaveHealth: "HEALTHY",
      unsyncedAnswersCount: 0,
      proctoringStrikes: 0,
      isNeedsAttention: true,
      incidentReasons: ["Auto-submitted due to network outage"],
    };
    redisStorage.set(REDIS_KEYS.attemptState(ASSESSMENT_ID, attemptId), JSON.stringify(liveRecord));

    // 2. Admin initiates review
    const reviewResult = await recoveryService.initiateReview(
      ASSESSMENT_ID,
      attemptId,
      "admin-999",
      "proctor-lead@company.com",
    );
    expect(reviewResult.status).toBe("ADMIN_REVIEW");

    // 3. Admin authorizes resume with +10 minutes grace time
    const resumeResult = await recoveryService.authorizeResume(
      ASSESSMENT_ID,
      attemptId,
      "admin-999",
      "proctor-lead@company.com",
      {
        extraTimeMinutes: 10,
        reason: "Confirmed transient regional ISP outage",
      },
    );
    expect(resumeResult.status).toBe("RESUME_AUTHORIZED");
    expect(resumeResult.extraTimeGrantedSeconds).toBe(600);
    expect(resumeResult.authoritativeRemainingSeconds).toBe(400 + 600);

    // 4. Candidate connects and handshakes
    prismaMock.testInstance.findUnique.mockResolvedValue({
      id: attemptId,
      status: "RESUME_AUTHORIZED",
      userId: candidateId,
      expiresAt: new Date(Date.now() + 1000 * 1000),
      executionState: {
        currentSectionIndex: 1,
        currentQuestionIndex: 2,
      },
    });

    const handshakeResult = await recoveryService.confirmCandidateResumed(attemptId, candidateId);
    expect(handshakeResult.canResume).toBe(true);
    expect(handshakeResult.status).toBe("ACTIVE");
  });
});
