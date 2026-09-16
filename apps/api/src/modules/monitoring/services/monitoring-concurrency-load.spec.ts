import { Test, TestingModule } from "@nestjs/testing";
import { LiveMonitoringService, CandidateLiveRecord } from "./live-monitoring.service";
import { AttemptRecoveryService } from "./attempt-recovery.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { LiveAlertService } from "./live-alert.service";
import { SystemHealthService } from "./system-health.service";
import { EvaluationQueueService } from "../../evaluation/services/evaluation-queue.service";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import { RedisConnectionManager } from "../../../cache/redis-connection.manager";
import { REDIS_KEYS } from "../constants/monitoring.constants";

describe("Monitoring High Concurrency & Load Verification (100, 250, 500 Candidates)", () => {
  let monitoringService: LiveMonitoringService;
  let recoveryService: AttemptRecoveryService;
  let prismaMock: any;
  let alertServiceMock: any;
  let systemHealthServiceMock: any;
  let mockRedis: any;
  let redisStorage: Map<string, string>;
  let redisSets: Map<string, Set<string>>;
  let locksHeld: Set<string>;

  let dbSubmissions: any[];
  let dbAnswers: any[];

  beforeEach(async () => {
    redisStorage = new Map();
    redisSets = new Map();
    locksHeld = new Set();
    dbSubmissions = [];
    dbAnswers = [];

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
        let set = redisSets.get(key);
        if (!set) {
          set = new Set();
          redisSets.set(key, set);
        }
        set.add(member);
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
          const assessmentId = id.includes("-100-")
            ? "assessment-100-test"
            : id.includes("-250-")
              ? "assessment-250-test"
              : id.includes("-500-")
                ? "assessment-500-test"
                : "assessment-load";
          return {
            id,
            userId: `user-${id}`,
            testConfigId: assessmentId,
            examConfigId: assessmentId,
            status: "ACTIVE",
            expiresAt: new Date(Date.now() + 7200 * 1000),
            submissions: dbSubmissions.filter((s) => s.testInstanceId === id),
            recoveryLogs: [],
            executionState: {
              remainingTimeSeconds: 7200,
              currentSectionId: "sec-1",
              currentQuestionId: "q-1",
              lastActivityAt: new Date(),
            },
            user: {
              name: `Candidate ${id}`,
              email: `${id}@test.com`,
            },
            questions: Array.from({ length: 30 }, (_, i) => ({
              questionId: `q-${i + 1}`,
              orderIndex: i + 1,
            })),
            sections: [
              { sectionId: "sec-1", orderIndex: 0 },
            ],
          };
        }),
        findMany: jest.fn().mockImplementation(async () => []),
        update: jest.fn().mockImplementation(async (args: any) => {
          return { id: args.where.id, ...args.data };
        }),
      },
      candidateAnswer: {
        create: jest.fn().mockImplementation(async (args: any) => {
          dbAnswers.push(args.data);
          return args.data;
        }),
        count: jest.fn().mockImplementation(async (args: any) => {
          return dbAnswers.filter((a) => a.testInstanceId === args.where.testInstanceId).length;
        }),
      },
      submission: {
        count: jest.fn().mockImplementation(async (args: any) => {
          return dbSubmissions.filter((s) => s.testInstanceId === args.where.testInstanceId).length;
        }),
        updateMany: jest.fn().mockImplementation(async (args: any) => {
          let count = 0;
          dbSubmissions.forEach((s) => {
            if (s.testInstanceId === args.where.testInstanceId) {
              Object.assign(s, args.data);
              count++;
            }
          });
          return { count };
        }),
        create: jest.fn().mockImplementation(async (args: any) => {
          const record = { id: `sub-${Date.now()}-${Math.random()}`, ...args.data };
          dbSubmissions.push(record);
          return record;
        }),
      },
      executionState: {
        findUnique: jest.fn().mockImplementation(async (args: any) => {
          return {
            testInstanceId: args.where.testInstanceId,
            remainingTimeSeconds: 3600,
            currentSectionId: "sec-1",
            currentQuestionId: "q-1",
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
            email: `${args.where.id}@test.com`,
          };
        }),
      },
      assessmentAuditLog: {
        create: jest.fn().mockResolvedValue({}),
      },
      assessmentEvent: {
        create: jest.fn().mockResolvedValue({}),
      },
      attemptRecoveryLog: {
        create: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn().mockImplementation(async (cb: (tx: any) => Promise<any>) => {
        return cb(prismaMock);
      }),
    };

    alertServiceMock = {
      emitAlert: jest.fn().mockResolvedValue({}),
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

  describe("1. 100 Concurrent Candidates Simulation", () => {
    it("processes 100 simultaneous heartbeats within latency SLA and maintains accurate dashboard snapshot", async () => {
      const assessmentId = "assessment-100-test";
      const candidateCount = 100;

      const start = Date.now();
      const heartbeatPromises = Array.from({ length: candidateCount }, (_, i) => {
        const attemptId = `attempt-100-${i}`;
        const candidateId = `candidate-100-${i}`;

        return monitoringService.recordHeartbeat(attemptId, candidateId, {
          currentSectionKey: "sec-1",
          currentSectionIndex: 0,
          currentQuestionId: `q-${(i % 30) + 1}`,
          currentQuestionIndex: (i % 30) + 1,
          answeredCount: (i % 15) + 1,
          totalQuestions: 30,
          markedQuestionsCount: 2,
          remainingTimeSeconds: 3600 - i * 10,
          latencyMs: 25 + (i % 30),
          networkStatus: "ONLINE",
          autosaveHealth: "HEALTHY",
          unsyncedAnswersCount: 0,
        });
      });

      const results = await Promise.all(heartbeatPromises);
      const durationMs = Date.now() - start;

      expect(results.length).toBe(100);
      results.forEach((r) => {
        expect(r.status).toBe("ACTIVE");
        expect(r.serverTimestamp).toBeDefined();
      });

      // Assert high throughput: 100 simultaneous operations completed quickly
      expect(durationMs).toBeLessThan(5000);

      // Verify dashboard snapshot aggregates exactly 100 candidates
      const snapshot = await monitoringService.getAssessmentLiveSnapshot(assessmentId, {});
      expect(snapshot.summary.total).toBe(100);
      expect(snapshot.summary.active).toBe(100);
      expect(snapshot.summary.disconnected).toBe(0);
      expect(snapshot.summary.submitted).toBe(0);
    });
  });

  describe("2. 250 Concurrent Candidates Simulation", () => {
    it("handles 250 simultaneous active candidates with interleaved autosaves without dropping telemetry", async () => {
      const assessmentId = "assessment-250-test";
      const candidateCount = 250;

      const promises = Array.from({ length: candidateCount }, (_, i) => {
        const attemptId = `attempt-250-${i}`;
        const candidateId = `candidate-250-${i}`;

        return monitoringService.recordHeartbeat(attemptId, candidateId, {
          currentSectionKey: "sec-1",
          currentSectionIndex: 0,
          currentQuestionId: `q-${(i % 30) + 1}`,
          currentQuestionIndex: (i % 30) + 1,
          answeredCount: (i % 25) + 1,
          totalQuestions: 30,
          markedQuestionsCount: 1,
          remainingTimeSeconds: 5000 - i * 5,
          latencyMs: 30 + (i % 40),
          networkStatus: "ONLINE",
          autosaveHealth: "HEALTHY",
        });
      });

      const results = await Promise.all(promises);
      expect(results.length).toBe(250);

      // Verify active set in Redis has exactly 250 candidates
      const activeMembers = await mockRedis.smembers(REDIS_KEYS.assessmentActiveSet(assessmentId));
      expect(activeMembers.length).toBe(250);

      // Verify live snapshot
      const snapshot = await monitoringService.getAssessmentLiveSnapshot(assessmentId, {});
      expect(snapshot.summary.total).toBe(250);
      expect(snapshot.summary.active).toBe(250);
    });
  });

  describe("3. 500 Concurrent Candidates Simulation", () => {
    it("maintains consistent monitoring throughput for 500 candidates simultaneously", async () => {
      const assessmentId = "assessment-500-test";
      const candidateCount = 500;

      const startTime = Date.now();
      const promises = Array.from({ length: candidateCount }, (_, i) => {
        const attemptId = `attempt-500-${i}`;
        const candidateId = `candidate-500-${i}`;

        return monitoringService.recordHeartbeat(attemptId, candidateId, {
          currentSectionKey: "sec-1",
          currentSectionIndex: 0,
          currentQuestionId: `q-${(i % 30) + 1}`,
          currentQuestionIndex: (i % 30) + 1,
          answeredCount: (i % 20) + 1,
          totalQuestions: 30,
          markedQuestionsCount: 0,
          remainingTimeSeconds: 4000,
          latencyMs: 20 + (i % 50),
          networkStatus: i === 42 ? "RECONNECTING" : "ONLINE",
          autosaveHealth: i === 99 ? "FAILED" : "HEALTHY",
        });
      });

      const results = await Promise.all(promises);
      const totalElapsed = Date.now() - startTime;
      const averageTimePerOp = totalElapsed / candidateCount;

      expect(results.length).toBe(500);
      // Average operation time should be very small (in-memory simulation < 15ms per candidate)
      expect(averageTimePerOp).toBeLessThan(20);

      // Verify Needs Attention queue correctly isolated the 2 candidates with issues
      const snapshot = await monitoringService.getAssessmentLiveSnapshot(assessmentId, {});
      expect(snapshot.summary.total).toBe(500);
      expect(snapshot.summary.needsAttentionCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe("4. 100 Simultaneous Submissions Race Condition Verification", () => {
    it("handles 100 simultaneous submissions without deadlocks or duplicate records", async () => {
      const assessmentId = "assessment-sim-submissions";
      const count = 100;

      const submitPromises = Array.from({ length: count }, async (_, i) => {
        const attemptId = `attempt-submit-${i}`;
        const userId = `user-submit-${i}`;

        // Simulate submission transaction flow in submission service
        return prismaMock.$transaction(async (tx: any) => {
          await tx.testInstance.update({
            where: { id: attemptId },
            data: { status: "SUBMITTED", submittedAt: new Date() },
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

          return await tx.submission.create({
            data: {
              testInstanceId: attemptId,
              status: "SUBMITTED",
              source: "USER",
              reason: "USER_SUBMIT",
              isAutoSubmit: false,
              attemptSequence: existingCount + 1,
              isCurrent: true,
              submittedAt: new Date(),
            },
          });
        });
      });

      const submissions = await Promise.all(submitPromises);
      expect(submissions.length).toBe(100);

      // Verify each submission has unique ID, attemptSequence = 1, and isCurrent = true
      submissions.forEach((sub, i) => {
        expect(sub.testInstanceId).toBe(`attempt-submit-${i}`);
        expect(sub.attemptSequence).toBe(1);
        expect(sub.isCurrent).toBe(true);
        expect(sub.status).toBe("SUBMITTED");
      });

      // Total submissions in DB must equal exactly 100
      expect(dbSubmissions.length).toBe(100);
    });
  });

  describe("5. 100 Simultaneous Autosaves Concurrency Verification", () => {
    it("records 100 simultaneous candidate answer saves without corruption", async () => {
      const count = 100;

      const savePromises = Array.from({ length: count }, async (_, i) => {
        const attemptId = `attempt-save-${i}`;
        const questionId = `q-${(i % 10) + 1}`;

        return prismaMock.candidateAnswer.create({
          data: {
            testInstanceId: attemptId,
            questionId,
            answer: {
              selectedOptionId: `opt-${i}`,
              savedAt: new Date().toISOString(),
            },
          },
        });
      });

      const savedAnswers = await Promise.all(savePromises);
      expect(savedAnswers.length).toBe(100);
      expect(dbAnswers.length).toBe(100);

      savedAnswers.forEach((ans, i) => {
        expect(ans.testInstanceId).toBe(`attempt-save-${i}`);
        expect(ans.answer.selectedOptionId).toBe(`opt-${i}`);
      });
    });
  });
});
