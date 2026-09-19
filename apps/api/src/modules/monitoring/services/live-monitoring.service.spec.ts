import { Test, TestingModule } from "@nestjs/testing";
import { LiveMonitoringService } from "./live-monitoring.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { LiveAlertService } from "./live-alert.service";
import { SystemHealthService } from "./system-health.service";
import { RedisConnectionManager } from "../../../cache/redis-connection.manager";
import { MONITORING_CONFIG, REDIS_KEYS } from "../constants/monitoring.constants";

describe("LiveMonitoringService", () => {
  let service: LiveMonitoringService;
  let prismaMock: any;
  let alertServiceMock: any;
  let systemHealthServiceMock: any;
  let mockRedis: any;
  let redisStorage: Map<string, string>;
  let redisSets: Map<string, Set<string>>;

  beforeEach(async () => {
    redisStorage = new Map();
    redisSets = new Map();

    mockRedis = {
      get: jest.fn().mockImplementation(async (key: string) => redisStorage.get(key) || null),
      set: jest.fn().mockImplementation(async (key: string, val: string) => {
        redisStorage.set(key, val);
        return "OK";
      }),
      del: jest.fn().mockImplementation(async (key: string) => {
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
        findUnique: jest.fn().mockResolvedValue({
          id: "attempt-101",
          testConfigId: "assessment-uuid",
          examConfigId: "assessment-uuid",
          userId: "candidate-user-1",
          status: "IN_PROGRESS",
          user: { id: "candidate-user-1", name: "Jane Doe", email: "jane@example.com" },
        }),
        update: jest.fn().mockResolvedValue({ id: "attempt-101" }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      executionState: {
        findUnique: jest.fn().mockResolvedValue({
          testInstanceId: "attempt-101",
          remainingTimeSeconds: 1800,
          currentSectionKey: "default",
          currentQuestionId: "q-1",
          currentSectionIndex: 0,
          currentQuestionIndex: 0,
        }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: "candidate-user-1",
          fullName: "Jane Doe",
          email: "jane@example.com",
        }),
      },
      candidateAnswer: {
        count: jest.fn().mockResolvedValue(2),
      },
      assessmentEvent: {
        create: jest.fn().mockResolvedValue({ id: "event-1" }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      assessmentAuditLog: {
        create: jest.fn().mockResolvedValue({ id: "audit-1" }),
      },
      submission: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    alertServiceMock = {
      emitAlert: jest.fn().mockResolvedValue({ id: "alert-1" }),
      createAlert: jest.fn().mockResolvedValue({ id: "alert-1" }),
    };

    systemHealthServiceMock = {
      getHealthSnapshot: jest.fn().mockResolvedValue({
        overallStatus: "HEALTHY",
        activeCandidates: 10,
        autosaveSuccessRate: 100,
        submissionSuccessRate: 100,
      }),
      trackCandidateDisconnect: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveMonitoringService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: LiveAlertService, useValue: alertServiceMock },
        { provide: SystemHealthService, useValue: systemHealthServiceMock },
      ],
    }).compile();

    service = module.get<LiveMonitoringService>(LiveMonitoringService);
  });

  afterEach(() => {
    service.onModuleDestroy();
    jest.clearAllMocks();
  });

  describe("Heartbeat Ingestion", () => {
    it("should ingest candidate heartbeat and store state in Redis", async () => {
      const result = await service.recordHeartbeat("attempt-101", "candidate-user-1", {
        currentSectionKey: "coding-1",
        currentSectionIndex: 0,
        currentQuestionId: "q-1",
        currentQuestionIndex: 0,
        answeredCount: 3,
        totalQuestions: 10,
        markedQuestionsCount: 1,
        remainingTimeSeconds: 1800,
        latencyMs: 85,
        networkStatus: "ONLINE",
        autosaveHealth: "HEALTHY",
        unsyncedAnswersCount: 0,
      });

      expect(result.status).toBe("ACTIVE");
      expect(result.serverTimestamp).toBeDefined();

      // Verify Redis was updated
      expect(mockRedis.set).toHaveBeenCalled();
      expect(mockRedis.sadd).toHaveBeenCalledWith(
        "assessment:assessment-uuid:active_attempts",
        "attempt-101",
      );
      expect(mockRedis.publish).toHaveBeenCalled();
    });

    it("should flag candidate as needs attention if autosave fails", async () => {
      await service.recordHeartbeat("attempt-101", "candidate-user-1", {
        currentSectionKey: "coding-1",
        currentSectionIndex: 0,
        currentQuestionId: "q-1",
        currentQuestionIndex: 0,
        answeredCount: 2,
        totalQuestions: 10,
        markedQuestionsCount: 0,
        remainingTimeSeconds: 1500,
        latencyMs: 120,
        networkStatus: "ONLINE",
        autosaveHealth: "FAILED",
        unsyncedAnswersCount: 2,
      });

      expect(alertServiceMock.emitAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: "P1",
          category: "AUTOSAVE",
        }),
      );
    });

    it("should flag candidate as needs attention if proctoring strikes reach threshold", async () => {
      // Strikes are server-authoritative (only ProctoringMonitoringService writes
      // them) — seed the live record directly rather than via the heartbeat DTO,
      // which must NOT be able to set strikes itself.
      const key = REDIS_KEYS.attemptState("assessment-uuid", "attempt-101");
      redisStorage.set(
        key,
        JSON.stringify({
          assessmentId: "assessment-uuid",
          attemptId: "attempt-101",
          candidateId: "candidate-user-1",
          candidateName: "Jane Doe",
          candidateEmail: "jane@example.com",
          status: "ACTIVE",
          currentSectionKey: "coding-1",
          currentSectionIndex: 0,
          currentQuestionId: "q-1",
          currentQuestionIndex: 0,
          answeredCount: 2,
          totalQuestions: 10,
          markedQuestionsCount: 0,
          remainingTimeSeconds: 1500,
          lastHeartbeatAt: Date.now(),
          lastStateSyncAt: Date.now(),
          latencyMs: 120,
          networkStatus: "ONLINE",
          autosaveHealth: "HEALTHY",
          unsyncedAnswersCount: 0,
          proctoringStrikes: MONITORING_CONFIG.HIGH_STRIKE_THRESHOLD,
          isNeedsAttention: false,
          incidentReasons: [],
        }),
      );

      await service.recordHeartbeat("attempt-101", "candidate-user-1", {
        currentSectionKey: "coding-1",
        currentSectionIndex: 0,
        currentQuestionId: "q-1",
        currentQuestionIndex: 0,
        answeredCount: 2,
        totalQuestions: 10,
        markedQuestionsCount: 0,
        remainingTimeSeconds: 1500,
        latencyMs: 120,
        networkStatus: "ONLINE",
        autosaveHealth: "HEALTHY",
        unsyncedAnswersCount: 0,
      });

      const record = await service.getCandidateLiveRecord("assessment-uuid", "attempt-101");
      expect(record?.proctoringStrikes).toBe(MONITORING_CONFIG.HIGH_STRIKE_THRESHOLD);
      expect(record?.isNeedsAttention).toBe(true);
      expect(record?.incidentReasons).toEqual(
        expect.arrayContaining([expect.stringContaining("High Proctoring Strikes")]),
      );
    });

    it("should ignore a client-supplied proctoringStrikes on heartbeat and never let it reset the server count", async () => {
      const key = REDIS_KEYS.attemptState("assessment-uuid", "attempt-101");
      redisStorage.set(
        key,
        JSON.stringify({
          assessmentId: "assessment-uuid",
          attemptId: "attempt-101",
          candidateId: "candidate-user-1",
          candidateName: "Jane Doe",
          candidateEmail: "jane@example.com",
          status: "ACTIVE",
          currentSectionKey: "coding-1",
          currentSectionIndex: 0,
          currentQuestionId: "q-1",
          currentQuestionIndex: 0,
          answeredCount: 2,
          totalQuestions: 10,
          markedQuestionsCount: 0,
          remainingTimeSeconds: 1500,
          lastHeartbeatAt: Date.now(),
          lastStateSyncAt: Date.now(),
          latencyMs: 120,
          networkStatus: "ONLINE",
          autosaveHealth: "HEALTHY",
          unsyncedAnswersCount: 0,
          proctoringStrikes: 4,
          isNeedsAttention: true,
          incidentReasons: ["High Strikes (4)"],
        }),
      );

      // A legacy/rogue client attempting to report strikeCount=0 on a routine
      // heartbeat (the field no longer exists on the DTO type at all — cast to
      // `any` to simulate such a payload still reaching the server).
      await service.recordHeartbeat("attempt-101", "candidate-user-1", {
        currentSectionKey: "coding-1",
        currentSectionIndex: 0,
        currentQuestionId: "q-1",
        currentQuestionIndex: 0,
        answeredCount: 2,
        totalQuestions: 10,
        markedQuestionsCount: 0,
        remainingTimeSeconds: 1500,
        latencyMs: 120,
        networkStatus: "ONLINE",
        autosaveHealth: "HEALTHY",
        unsyncedAnswersCount: 0,
        proctoringStrikes: 0,
      } as any);

      const record = await service.getCandidateLiveRecord("assessment-uuid", "attempt-101");
      expect(record?.proctoringStrikes).toBe(4);
    });

    it("should transition candidate from NOT_STARTED to ACTIVE on incoming heartbeat", async () => {
      const key = REDIS_KEYS.attemptState("assessment-uuid", "attempt-not-started");
      redisStorage.set(
        key,
        JSON.stringify({
          assessmentId: "assessment-uuid",
          attemptId: "attempt-not-started",
          candidateId: "candidate-user-2",
          candidateName: "John Doe",
          candidateEmail: "john@example.com",
          status: "NOT_STARTED",
          currentSectionKey: "sec-1",
          currentSectionIndex: 0,
          currentQuestionId: "q-1",
          currentQuestionIndex: 0,
          answeredCount: 0,
          totalQuestions: 10,
          markedQuestionsCount: 0,
          remainingTimeSeconds: 3600,
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          lastHeartbeatAt: Date.now(),
          lastStateSyncAt: Date.now(),
          latencyMs: 40,
          networkStatus: "ONLINE",
          autosaveHealth: "HEALTHY",
          unsyncedAnswersCount: 0,
          proctoringStrikes: 0,
          isNeedsAttention: false,
          incidentReasons: [],
        }),
      );

      const result = await service.recordHeartbeat("attempt-not-started", "candidate-user-2", {
        currentSectionKey: "sec-1",
        currentSectionIndex: 0,
        currentQuestionId: "q-1",
        currentQuestionIndex: 0,
        answeredCount: 1,
        totalQuestions: 10,
        remainingTimeSeconds: 3500,
      });

      expect(result.status).toBe("ACTIVE");
      const record = await service.getCandidateLiveRecord("assessment-uuid", "attempt-not-started");
      expect(record?.status).toBe("ACTIVE");
      expect(record?.answeredCount).toBe(1);
    });

    it("should NOT auto-submit if expiresAt is in the future even if client sends remainingTimeSeconds: 0", async () => {
      const futureExpiry = new Date(Date.now() + 7200000).toISOString();
      const key = REDIS_KEYS.attemptState("assessment-uuid", "attempt-future");
      redisStorage.set(
        key,
        JSON.stringify({
          assessmentId: "assessment-uuid",
          attemptId: "attempt-future",
          candidateId: "candidate-user-3",
          candidateName: "Alice",
          candidateEmail: "alice@example.com",
          status: "ACTIVE",
          currentSectionKey: "sec-1",
          currentSectionIndex: 0,
          currentQuestionId: "q-1",
          currentQuestionIndex: 0,
          answeredCount: 5,
          totalQuestions: 10,
          markedQuestionsCount: 0,
          remainingTimeSeconds: 7200,
          expiresAt: futureExpiry,
          lastHeartbeatAt: Date.now(),
          lastStateSyncAt: Date.now(),
          latencyMs: 40,
          networkStatus: "ONLINE",
          autosaveHealth: "HEALTHY",
          unsyncedAnswersCount: 0,
          proctoringStrikes: 0,
          isNeedsAttention: false,
          incidentReasons: [],
        }),
      );

      const result = await service.recordHeartbeat("attempt-future", "candidate-user-3", {
        currentSectionKey: "sec-1",
        currentSectionIndex: 0,
        currentQuestionId: "q-1",
        currentQuestionIndex: 0,
        answeredCount: 5,
        totalQuestions: 10,
        remainingTimeSeconds: 0, // Client sending 0 e.g. at end of test window
      });

      // Status must remain ACTIVE because authoritative expiresAt has 2 hours left!
      expect(result.status).toBe("ACTIVE");
      expect(result.directive).toBeUndefined();
      expect(result.remainingTimeSeconds).toBeGreaterThan(7000);
    });
  });

  describe("Watchdog Candidate Audit", () => {
    it("should transition active candidate to DISCONNECTED after 30s of silence", async () => {
      // Setup candidate record in Redis with heartbeat 35s in the past
      const pastTime = Date.now() - (MONITORING_CONFIG.HEARTBEAT_DISCONNECT_THRESHOLD_MS + 5000);
      const initialRecord = {
        assessmentId: "assessment-uuid",
        attemptId: "attempt-101",
        candidateId: "candidate-user-1",
        candidateName: "Jane Doe",
        candidateEmail: "jane@example.com",
        status: "ACTIVE",
        currentSectionKey: "sec-1",
        currentSectionIndex: 0,
        currentQuestionId: "q-1",
        currentQuestionIndex: 0,
        answeredCount: 1,
        totalQuestions: 10,
        markedQuestionsCount: 0,
        remainingTimeSeconds: 1000,
        lastHeartbeatAt: pastTime,
        lastStateSyncAt: pastTime,
        latencyMs: 50,
        networkStatus: "ONLINE",
        autosaveHealth: "HEALTHY",
        unsyncedAnswersCount: 0,
        proctoringStrikes: 0,
        isNeedsAttention: false,
        incidentReasons: [],
      };

      const key = REDIS_KEYS.attemptState("assessment-uuid", "attempt-101");
      redisStorage.set(key, JSON.stringify(initialRecord));
      redisSets.set("assessment:assessment-uuid:active_attempts", new Set(["attempt-101"]));

      await service.runWatchdogAudit();

      // Verify status changed to DISCONNECTED
      const updatedRaw = redisStorage.get(key);
      const updated = JSON.parse(updatedRaw!);
      expect(updated.status).toBe("DISCONNECTED");
      expect(updated.isNeedsAttention).toBe(true);
      expect(alertServiceMock.emitAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          category: "DISCONNECT",
          severity: "P2",
        }),
      );
    });

    it("should trigger prolonged disconnect P1 alert after 90s silence", async () => {
      const pastTime = Date.now() - (MONITORING_CONFIG.PROLONGED_DISCONNECT_THRESHOLD_MS + 5000);
      const initialRecord = {
        assessmentId: "assessment-uuid",
        attemptId: "attempt-101",
        candidateId: "candidate-user-1",
        candidateName: "Jane Doe",
        candidateEmail: "jane@example.com",
        status: "DISCONNECTED",
        currentSectionKey: "sec-1",
        currentSectionIndex: 0,
        currentQuestionId: "q-1",
        currentQuestionIndex: 0,
        answeredCount: 1,
        totalQuestions: 10,
        markedQuestionsCount: 0,
        remainingTimeSeconds: 1000,
        lastHeartbeatAt: pastTime,
        lastStateSyncAt: pastTime,
        latencyMs: 50,
        networkStatus: "OFFLINE",
        autosaveHealth: "HEALTHY",
        unsyncedAnswersCount: 0,
        proctoringStrikes: 0,
        isNeedsAttention: true,
        incidentReasons: ["Disconnected (>30s)"],
      };

      const key = REDIS_KEYS.attemptState("assessment-uuid", "attempt-101");
      redisStorage.set(key, JSON.stringify(initialRecord));
      redisSets.set("assessment:assessment-uuid:active_attempts", new Set(["attempt-101"]));

      await service.runWatchdogAudit();

      expect(alertServiceMock.emitAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          category: "DISCONNECT",
          severity: "P1",
          title: "Prolonged Candidate Disconnect",
        }),
      );
    });
  });

  describe("State Transitions", () => {
    it("should enforce valid state machine transitions", async () => {
      // Set initial state
      const initialRecord = {
        assessmentId: "assessment-uuid",
        attemptId: "attempt-101",
        candidateId: "candidate-user-1",
        candidateName: "Jane Doe",
        candidateEmail: "jane@example.com",
        status: "ACTIVE",
        currentSectionKey: "sec-1",
        currentSectionIndex: 0,
        currentQuestionId: "q-1",
        currentQuestionIndex: 0,
        answeredCount: 5,
        totalQuestions: 10,
        markedQuestionsCount: 0,
        remainingTimeSeconds: 1000,
        lastHeartbeatAt: Date.now(),
        lastStateSyncAt: Date.now(),
        latencyMs: 50,
        networkStatus: "ONLINE",
        autosaveHealth: "HEALTHY",
        unsyncedAnswersCount: 0,
        proctoringStrikes: 0,
        isNeedsAttention: false,
        incidentReasons: [],
      };

      const key = REDIS_KEYS.attemptState("assessment-uuid", "attempt-101");
      redisStorage.set(key, JSON.stringify(initialRecord));

      // ACTIVE -> AUTO_SUBMITTED is valid
      const transitioned = await service.transitionCandidateState(
        "assessment-uuid",
        "attempt-101",
        "AUTO_SUBMITTED",
        "admin-1",
        "ADMIN",
        "Suspicious activity",
      );

      expect(transitioned.status).toBe("AUTO_SUBMITTED");
      expect(transitioned.isNeedsAttention).toBe(true);

      // Attempting invalid transition: AUTO_SUBMITTED -> ACTIVE directly should throw BadRequestException
      await expect(
        service.transitionCandidateState(
          "assessment-uuid",
          "attempt-101",
          "ACTIVE",
          "admin-1",
          "ADMIN",
        ),
      ).rejects.toThrow();
    });
  });
});
