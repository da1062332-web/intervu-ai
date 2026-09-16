import { Test, TestingModule } from "@nestjs/testing";
import { LiveMonitoringService } from "./live-monitoring.service";
import { AttemptRecoveryService } from "./attempt-recovery.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { LiveAlertService } from "./live-alert.service";
import { SystemHealthService } from "./system-health.service";
import { EvaluationQueueService } from "../../evaluation/services/evaluation-queue.service";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import { RedisConnectionManager } from "../../../cache/redis-connection.manager";
import { ConflictException } from "@nestjs/common";

describe("Monitoring Chaos & Resilience Verification", () => {
  let monitoringService: LiveMonitoringService;
  let recoveryService: AttemptRecoveryService;
  let prismaMock: any;
  let alertServiceMock: any;
  let systemHealthServiceMock: any;
  let mockRedis: any;
  let redisStorage: Map<string, string>;
  let redisSets: Map<string, Set<string>>;
  let locksHeld: Set<string>;
  let isRedisHealthy: boolean;

  // In-memory PostgreSQL mock store for full state persistence
  let dbTestInstances: Map<string, any>;
  let dbCandidateAnswers: Map<string, any>;
  let dbSubmissions: any[];
  let dbRecoveryLogs: any[];
  let dbAuditLogs: any[];
  let dbAssessmentEvents: any[];

  beforeEach(async () => {
    redisStorage = new Map();
    redisSets = new Map();
    locksHeld = new Set();
    isRedisHealthy = true;

    dbTestInstances = new Map();
    dbCandidateAnswers = new Map();
    dbSubmissions = [];
    dbRecoveryLogs = [];
    dbAuditLogs = [];
    dbAssessmentEvents = [];

    mockRedis = {
      get: jest.fn().mockImplementation(async (key: string) => {
        if (!isRedisHealthy) throw new Error("ECONNREFUSED: Redis connection dropped");
        return redisStorage.get(key) || null;
      }),
      set: jest.fn().mockImplementation(async (key: string, val: string, _mode?: string, _ttl?: number, flag?: string) => {
        if (!isRedisHealthy) throw new Error("ECONNREFUSED: Redis connection dropped");
        if (flag === "NX") {
          if (locksHeld.has(key)) return null;
          locksHeld.add(key);
          return "OK";
        }
        redisStorage.set(key, val);
        return "OK";
      }),
      del: jest.fn().mockImplementation(async (key: string) => {
        if (!isRedisHealthy) throw new Error("ECONNREFUSED: Redis connection dropped");
        locksHeld.delete(key);
        redisStorage.delete(key);
        return 1;
      }),
      sadd: jest.fn().mockImplementation(async (key: string, member: string) => {
        if (!isRedisHealthy) throw new Error("ECONNREFUSED: Redis connection dropped");
        if (!redisSets.has(key)) redisSets.set(key, new Set());
        redisSets.get(key)!.add(member);
        return 1;
      }),
      srem: jest.fn().mockImplementation(async (key: string, member: string) => {
        if (!isRedisHealthy) throw new Error("ECONNREFUSED: Redis connection dropped");
        if (redisSets.has(key)) redisSets.get(key)!.delete(member);
        return 1;
      }),
      smembers: jest.fn().mockImplementation(async (key: string) => {
        if (!isRedisHealthy) throw new Error("ECONNREFUSED: Redis connection dropped");
        return Array.from(redisSets.get(key) || []);
      }),
      keys: jest.fn().mockImplementation(async (pattern: string) => {
        if (!isRedisHealthy) throw new Error("ECONNREFUSED: Redis connection dropped");
        const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
        const matchingKeys: string[] = [];
        for (const k of Array.from(redisSets.keys()).concat(Array.from(redisStorage.keys()))) {
          if (regex.test(k) && !matchingKeys.includes(k)) {
            matchingKeys.push(k);
          }
        }
        return matchingKeys;
      }),
      publish: jest.fn().mockImplementation(async () => {
        if (!isRedisHealthy) throw new Error("ECONNREFUSED: Redis connection dropped");
        return 1;
      }),
    };

    jest.spyOn(RedisConnectionManager, "isConnected").mockImplementation(() => isRedisHealthy);
    jest.spyOn(RedisConnectionManager, "getInstance").mockImplementation(() => {
      if (!isRedisHealthy) throw new Error("Redis cluster unreachable");
      return mockRedis as any;
    });

    prismaMock = {
      testInstance: {
        findUnique: jest.fn().mockImplementation(async (args: any) => {
          const id = args.where.id;
          const inst = dbTestInstances.get(id);
          if (!inst) return null;
          return {
            ...inst,
            submissions: dbSubmissions.filter((s) => s.testInstanceId === id),
            recoveryLogs: dbRecoveryLogs.filter((r) => r.attemptId === id),
            candidateAnswers: Array.from(dbCandidateAnswers.values()).filter((a) => a.testInstanceId === id),
            executionState: {
              remainingTimeSeconds: inst.remainingTimeSeconds || 3600,
              currentSectionId: "section-1",
              currentQuestionId: "q-18",
              lastActivityAt: new Date(),
            },
            user: {
              name: `Candidate-${id}`,
              email: `candidate-${id}@test.com`,
            },
            questions: [
              { questionId: "q-18", orderIndex: 18 },
            ],
            sections: [
              { sectionId: "sec-1", orderIndex: 0 },
            ],
          };
        }),
        update: jest.fn().mockImplementation(async (args: any) => {
          const id = args.where.id;
          const existing = dbTestInstances.get(id) || { id };
          const updated = { ...existing, ...args.data };
          dbTestInstances.set(id, updated);
          return updated;
        }),
      },
      candidateAnswer: {
        create: jest.fn().mockImplementation(async (args: any) => {
          const ansKey = `${args.data.testInstanceId}-${args.data.questionId}`;
          dbCandidateAnswers.set(ansKey, args.data);
          return args.data;
        }),
        count: jest.fn().mockImplementation(async (args: any) => {
          const id = args.where.testInstanceId;
          return Array.from(dbCandidateAnswers.values()).filter((a) => a.testInstanceId === id).length;
        }),
        findMany: jest.fn().mockImplementation(async (args: any) => {
          const id = args.where.testInstanceId;
          return Array.from(dbCandidateAnswers.values()).filter((a) => a.testInstanceId === id);
        }),
      },
      submission: {
        count: jest.fn().mockImplementation(async (args: any) => {
          const id = args.where.testInstanceId;
          return dbSubmissions.filter((s) => s.testInstanceId === id).length;
        }),
        findFirst: jest.fn().mockImplementation(async (args: any) => {
          const id = args.where.testInstanceId;
          const isCurrent = args.where.isCurrent;
          return (
            dbSubmissions.find(
              (s) => s.testInstanceId === id && (isCurrent === undefined || s.isCurrent === isCurrent),
            ) || null
          );
        }),
        updateMany: jest.fn().mockImplementation(async (args: any) => {
          const id = args.where.testInstanceId;
          let count = 0;
          dbSubmissions.forEach((s) => {
            if (s.testInstanceId === id && (args.where.isCurrent === undefined || s.isCurrent === args.where.isCurrent)) {
              Object.assign(s, args.data);
              count++;
            }
          });
          return { count };
        }),
        create: jest.fn().mockImplementation(async (args: any) => {
          const rec = { id: `sub-${Date.now()}-${Math.random()}`, ...args.data };
          dbSubmissions.push(rec);
          return rec;
        }),
      },
      executionState: {
        findUnique: jest.fn().mockImplementation(async (args: any) => {
          const id = args.where.testInstanceId;
          const inst = dbTestInstances.get(id);
          return {
            testInstanceId: id,
            remainingTimeSeconds: inst?.remainingTimeSeconds || 3600,
            currentSectionId: "section-1",
            currentQuestionId: "q-18",
            lastActivityAt: new Date(),
          };
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      user: {
        findUnique: jest.fn().mockImplementation(async (args: any) => {
          return {
            id: args.where.id,
            fullName: `Candidate ${args.where.id}`,
            email: `candidate-${args.where.id}@test.com`,
          };
        }),
      },
      attemptRecoveryLog: {
        create: jest.fn().mockImplementation(async (args: any) => {
          const rec = { id: `recov-${Date.now()}`, ...args.data };
          dbRecoveryLogs.push(rec);
          return rec;
        }),
        findMany: jest.fn().mockImplementation(async (args: any) => {
          return dbRecoveryLogs.filter((r) => r.attemptId === args.where.attemptId);
        }),
      },
      assessmentAuditLog: {
        create: jest.fn().mockImplementation(async (args: any) => {
          const rec = { id: `audit-${Date.now()}`, ...args.data };
          dbAuditLogs.push(rec);
          return rec;
        }),
        findMany: jest.fn().mockImplementation(async (args: any) => {
          return dbAuditLogs.filter((a) => a.attemptId === args.where.attemptId);
        }),
      },
      assessmentEvent: {
        create: jest.fn().mockImplementation(async (args: any) => {
          const rec = { id: `event-${Date.now()}`, ...args.data };
          dbAssessmentEvents.push(rec);
          return rec;
        }),
        findMany: jest.fn().mockImplementation(async (args: any) => {
          return dbAssessmentEvents.filter((e) => e.attemptId === args?.where?.attemptId);
        }),
      },
      $transaction: jest.fn().mockImplementation(async (cb: (tx: any) => Promise<any>) => {
        return cb(prismaMock);
      }),
    };

    alertServiceMock = {
      recordIncident: jest.fn().mockResolvedValue({}),
      recordProctoringViolation: jest.fn().mockResolvedValue({}),
      getActiveAlerts: jest.fn().mockResolvedValue([]),
    };

    systemHealthServiceMock = {
      recordHeartbeatSample: jest.fn(),
      recordAutosaveFailure: jest.fn(),
      recordDisconnect: jest.fn(),
      recordReconnection: jest.fn(),
      getPlatformHealth: jest.fn().mockResolvedValue({ status: "HEALTHY" }),
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

  describe("1. Redis Outage Chaos Test", () => {
    it("candidate heartbeat and exam continues seamlessly when Redis is completely down", async () => {
      const attemptId = "attempt-redis-chaos";
      const candidateId = "candidate-redis-chaos";
      const assessmentId = "assessment-chaos";

      // Seed candidate in DB
      dbTestInstances.set(attemptId, {
        id: attemptId,
        userId: candidateId,
        testConfigId: assessmentId,
        examConfigId: assessmentId,
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + 3600 * 1000),
      });

      // 1. Initial heartbeat while Redis is healthy
      const hb1 = await monitoringService.recordHeartbeat(attemptId, candidateId, {
        currentSectionKey: "section-1",
        currentSectionIndex: 0,
        currentQuestionId: "q-1",
        currentQuestionIndex: 1,
        answeredCount: 1,
        totalQuestions: 20,
        markedQuestionsCount: 0,
        remainingTimeSeconds: 3590,
        latencyMs: 35,
        networkStatus: "ONLINE",
        autosaveHealth: "HEALTHY",
      });
      expect(hb1.status).toBe("ACTIVE");

      // 2. CHAOS: Kill Redis completely
      isRedisHealthy = false;

      // 3. Candidate sends subsequent heartbeat with Redis DEAD
      // Must NOT throw 500 error, must continue exam gracefully
      const hb2 = await monitoringService.recordHeartbeat(attemptId, candidateId, {
        currentSectionKey: "section-1",
        currentSectionIndex: 0,
        currentQuestionId: "q-2",
        currentQuestionIndex: 2,
        answeredCount: 2,
        totalQuestions: 20,
        markedQuestionsCount: 0,
        remainingTimeSeconds: 3580,
        latencyMs: 40,
        networkStatus: "ONLINE",
        autosaveHealth: "HEALTHY",
      });

      expect(hb2).toBeDefined();
      expect(hb2.serverTimestamp).toBeDefined();
      expect(hb2.status).toBe("ACTIVE");

      // 4. Candidate saves answer while Redis is dead
      await prismaMock.candidateAnswer.create({
        data: {
          testInstanceId: attemptId,
          questionId: "q-2",
          answer: { selectedOptionId: "opt-b" },
        },
      });

      const savedCount = await prismaMock.candidateAnswer.count({
        where: { testInstanceId: attemptId },
      });
      expect(savedCount).toBe(1);
    });
  });

  describe("2. Server Crash & Recovery Test (State Preservation)", () => {
    it("restores state and Question 18 answer from DB after full server crash & cache wipe", async () => {
      const attemptId = "attempt-crash-recovery";
      const candidateId = "candidate-crash";
      const assessmentId = "assessment-crash";

      // Seed candidate with Question 18 answer in PostgreSQL
      dbTestInstances.set(attemptId, {
        id: attemptId,
        userId: candidateId,
        testConfigId: assessmentId,
        examConfigId: assessmentId,
        status: "ACTIVE",
        expiresAt: new Date(Date.now() + 1800 * 1000),
      });

      // Candidate saves Question 18 code answer
      const q18Answer = {
        code: "function solve(a, b) { return a + b; }",
        language: "typescript",
        testCasesPassed: 5,
      };
      await prismaMock.candidateAnswer.create({
        data: {
          testInstanceId: attemptId,
          questionId: "q-18",
          answer: q18Answer,
        },
      });

      // SIMULATE SERVER CRASH:
      // Ephemeral Redis cache is completely wiped out
      redisStorage.clear();
      redisSets.clear();
      locksHeld.clear();

      // Candidate reconnects and requests candidate detail / live snapshot
      const hydratedRecord = await monitoringService.getCandidateDetail(assessmentId, attemptId);

      expect(hydratedRecord).toBeDefined();
      expect(hydratedRecord.attemptId).toBe(attemptId);
      expect(hydratedRecord.liveState.status).toBe("ACTIVE");
      expect(hydratedRecord.answers.length).toBe(1);

      // Verify the candidate answers from DB are completely preserved
      const dbAnswers = Array.from(dbCandidateAnswers.values()).filter(
        (a) => a.testInstanceId === attemptId,
      );
      expect(dbAnswers.length).toBe(1);
      expect(dbAnswers[0].questionId).toBe("q-18");
      expect(dbAnswers[0].answer).toEqual(q18Answer);
    });
  });

  describe("3. 4-Way Concurrency Race Test (Multi-Admin & Reconnect Race)", () => {
    it("strictly serializes concurrent admin recovery actions allowing exactly ONE to succeed", async () => {
      const attemptId = "attempt-race-4way";
      const assessmentId = "assessment-race";

      dbTestInstances.set(attemptId, {
        id: attemptId,
        userId: "candidate-race",
        testConfigId: assessmentId,
        status: "AUTO_SUBMITTED",
        expiresAt: new Date(Date.now() - 1000),
      });

      dbSubmissions.push({
        id: "sub-auto-1",
        testInstanceId: attemptId,
        status: "AUTO_SUBMITTED",
        isAutoSubmit: true,
        attemptSequence: 1,
        isCurrent: true,
      });

      // 4 simultaneous actions fired concurrently in the exact same millisecond:
      // - Admin 1 authorizes resume with 10 extra mins
      // - Admin 2 authorizes resume with 15 extra mins
      // - Admin 3 authorizes resume with 5 extra mins
      // - Admin 4 authorizes resume with 20 extra mins
      const actions = [
        recoveryService.authorizeResume(assessmentId, attemptId, "admin-1", "admin1@test.com", {
          reason: "Internet failure verified by Admin 1",
          extraTimeMinutes: 10,
        }),
        recoveryService.authorizeResume(assessmentId, attemptId, "admin-2", "admin2@test.com", {
          reason: "Internet failure verified by Admin 2",
          extraTimeMinutes: 15,
        }),
        recoveryService.authorizeResume(assessmentId, attemptId, "admin-3", "admin3@test.com", {
          reason: "Internet failure verified by Admin 3",
          extraTimeMinutes: 5,
        }),
        recoveryService.authorizeResume(assessmentId, attemptId, "admin-4", "admin4@test.com", {
          reason: "Internet failure verified by Admin 4",
          extraTimeMinutes: 20,
        }),
      ];

      const results = await Promise.allSettled(actions);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      // EXACTLY ONE action must succeed
      expect(fulfilled.length).toBe(1);
      // The other 3 concurrent actions must be safely rejected with 409 ConflictException
      expect(rejected.length).toBe(3);
      rejected.forEach((r: any) => {
        expect(r.reason).toBeInstanceOf(ConflictException);
      });

      // Verify DB state: exactly 1 recovery log was created
      expect(dbRecoveryLogs.length).toBe(1);
      // Attempt status transitioned to RESUME_AUTHORIZED
      const updatedAttempt = dbTestInstances.get(attemptId);
      expect(updatedAttempt.status).toBe("RESUME_AUTHORIZED");
    });
  });

  describe("4. Server-Authoritative Timer Expiry Race", () => {
    it("rejects candidate manipulated remainingTime and triggers server auto-submit on expiresAt", async () => {
      const attemptId = "attempt-timer-cheat";
      const candidateId = "candidate-cheat";
      const assessmentId = "assessment-timer";

      // Server record has already expired 30 seconds ago
      const expiredTime = new Date(Date.now() - 30 * 1000);
      dbTestInstances.set(attemptId, {
        id: attemptId,
        userId: candidateId,
        testConfigId: assessmentId,
        status: "ACTIVE",
        expiresAt: expiredTime,
      });

      // Candidate sends a fraudulent / frozen remainingTimeSeconds of 3600 seconds (1 hour)
      const heartbeatRes = await monitoringService.recordHeartbeat(attemptId, candidateId, {
        currentSectionKey: "section-1",
        currentSectionIndex: 0,
        currentQuestionId: "q-10",
        currentQuestionIndex: 10,
        answeredCount: 5,
        totalQuestions: 20,
        markedQuestionsCount: 0,
        remainingTimeSeconds: 3600, // FRAUDULENT
        latencyMs: 30,
        networkStatus: "ONLINE",
        autosaveHealth: "HEALTHY",
      });

      // Server authority overrides:
      // Authoritative time must be 0 and directive must be FORCE_SUBMIT
      expect(heartbeatRes.remainingTimeSeconds).toBe(0);
      expect(heartbeatRes.directive).toBe("FORCE_SUBMIT");
    });
  });

  describe("5. Forensic Submission Immutability Audit Trail", () => {
    it("preserves initial AUTO_SUBMITTED record untouched and creates separate sequential FINAL_SUBMITTED record", async () => {
      const attemptId = "attempt-forensic-audit";
      const candidateId = "candidate-audit";
      const assessmentId = "assessment-audit";

      // 1. Candidate is AUTO_SUBMITTED due to proctoring violation
      dbTestInstances.set(attemptId, {
        id: attemptId,
        userId: candidateId,
        testConfigId: assessmentId,
        status: "AUTO_SUBMITTED",
        expiresAt: new Date(Date.now() - 60 * 1000),
      });

      const initialAutoSubmit = {
        id: "sub-auto-1",
        testInstanceId: attemptId,
        status: "AUTO_SUBMITTED",
        source: "RULE_ENGINE",
        reason: "PROCTORING_LIMIT",
        reasonDetails: "Multiple face deviations detected",
        isAutoSubmit: true,
        attemptSequence: 1,
        isCurrent: true,
        submittedAt: new Date(Date.now() - 60 * 1000),
      };
      dbSubmissions.push(initialAutoSubmit);

      // 2. Admin inspects and authorizes resume with 10 extra minutes
      const resumeResult = await recoveryService.authorizeResume(
        assessmentId,
        attemptId,
        "admin-proctor-1",
        "proctor@university.edu",
        {
          reason: "Candidate webcam glitch resolved after identity verification",
          extraTimeMinutes: 10,
        },
      );
      expect(resumeResult.success).toBe(true);

      // Verify that initial AUTO_SUBMITTED submission record was NOT mutated or deleted
      const firstSubmission = dbSubmissions.find((s) => s.id === "sub-auto-1");
      expect(firstSubmission).toBeDefined();
      expect(firstSubmission.status).toBe("AUTO_SUBMITTED"); // UNTOUCHED!
      expect(firstSubmission.reason).toBe("PROCTORING_LIMIT"); // UNTOUCHED!
      expect(firstSubmission.reasonDetails).toBe("Multiple face deviations detected"); // UNTOUCHED!
      expect(firstSubmission.isCurrent).toBe(false); // Only flag adjusted

      // 3. Recovery log exists with audit trail
      expect(dbRecoveryLogs.length).toBe(1);
      expect(dbRecoveryLogs[0].adminEmail).toBe("proctor@university.edu");
      expect(dbRecoveryLogs[0].extraTimeSeconds).toBe(600);

      // 4. Candidate completes exam and submits final answers
      const existingCount = await prismaMock.submission.count({
        where: { testInstanceId: attemptId },
      });
      await prismaMock.submission.updateMany({
        where: { testInstanceId: attemptId, isCurrent: true },
        data: { isCurrent: false },
      });

      const finalSubmission = await prismaMock.submission.create({
        data: {
          testInstanceId: attemptId,
          status: "FINAL_SUBMITTED",
          source: "USER",
          reason: "USER_SUBMIT",
          reasonDetails: "Candidate completed assessment normally after recovery",
          isAutoSubmit: false,
          attemptSequence: existingCount + 1,
          isCurrent: true,
          submittedAt: new Date(),
        },
      });

      expect(finalSubmission.attemptSequence).toBe(2);
      expect(finalSubmission.status).toBe("FINAL_SUBMITTED");
      expect(finalSubmission.isCurrent).toBe(true);

      // Total submissions for this attempt = 2 (Forensic history complete)
      const allSubmissions = dbSubmissions.filter((s) => s.testInstanceId === attemptId);
      expect(allSubmissions.length).toBe(2);
      expect(allSubmissions[0].status).toBe("AUTO_SUBMITTED");
      expect(allSubmissions[1].status).toBe("FINAL_SUBMITTED");
    });
  });
});
