import { Test, TestingModule } from "@nestjs/testing";
import { AttemptRecoveryService } from "./attempt-recovery.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { LiveMonitoringService } from "./live-monitoring.service";
import { LiveAlertService } from "./live-alert.service";
import { EvaluationQueueService } from "../../evaluation/services/evaluation-queue.service";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import { RedisConnectionManager } from "../../../cache/redis-connection.manager";
import { ConflictException, BadRequestException, NotFoundException } from "@nestjs/common";

describe("AttemptRecoveryService", () => {
  let service: AttemptRecoveryService;
  let prismaMock: any;
  let monitoringServiceMock: any;
  let alertServiceMock: any;
  let mockRedis: any;
  let locksHeld: Set<string>;

  beforeEach(async () => {
    locksHeld = new Set();

    mockRedis = {
      set: jest.fn().mockImplementation(async (key: string, _val: string, _mode?: string, _ttl?: number, flag?: string) => {
        if (flag === "NX") {
          if (locksHeld.has(key)) return null;
          locksHeld.add(key);
          return "OK";
        }
        return "OK";
      }),
      del: jest.fn().mockImplementation(async (key: string) => {
        locksHeld.delete(key);
        return 1;
      }),
      get: jest.fn().mockResolvedValue(null),
      publish: jest.fn().mockResolvedValue(1),
    };

    jest.spyOn(RedisConnectionManager, "isConnected").mockReturnValue(true);
    jest.spyOn(RedisConnectionManager, "getInstance").mockReturnValue(mockRedis as any);

    prismaMock = {
      testInstance: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({ id: "attempt-1" }),
      },
      candidateAnswer: {
        count: jest.fn().mockResolvedValue(5),
      },
      submission: {
        update: jest.fn().mockResolvedValue({ id: "sub-1" }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      executionState: {
        update: jest.fn().mockResolvedValue({}),
      },
      attemptRecoveryLog: {
        create: jest.fn().mockResolvedValue({ id: "recov-log-1" }),
      },
      assessmentAuditLog: {
        create: jest.fn().mockResolvedValue({ id: "audit-1" }),
      },
      assessmentEvent: {
        create: jest.fn().mockResolvedValue({ id: "event-1" }),
      },
      $transaction: jest.fn().mockImplementation(async (cb: (tx: any) => Promise<any>) => {
        return cb(prismaMock);
      }),
    };

    monitoringServiceMock = {
      transitionCandidateState: jest.fn().mockResolvedValue({
        attemptId: "attempt-1",
        status: "ADMIN_REVIEW",
        candidateName: "Jane Doe",
      }),
      getCandidateLiveRecord: jest.fn().mockResolvedValue({
        attemptId: "attempt-1",
        status: "RESUME_AUTHORIZED",
      }),
    };

    alertServiceMock = {
      createAlert: jest.fn().mockResolvedValue({ id: "alert-1" }),
      emitAlert: jest.fn().mockResolvedValue({ id: "alert-1" }),
    };

    const evaluationQueueServiceMock = {
      enqueueSubmission: jest.fn().mockResolvedValue(undefined),
    };

    const cacheServiceMock = {
      acquireLock: jest.fn().mockResolvedValue(true),
      releaseLock: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttemptRecoveryService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: LiveMonitoringService, useValue: monitoringServiceMock },
        { provide: LiveAlertService, useValue: alertServiceMock },
        { provide: EvaluationQueueService, useValue: evaluationQueueServiceMock },
        { provide: RedisCacheService, useValue: cacheServiceMock },
      ],
    }).compile();

    service = module.get<AttemptRecoveryService>(AttemptRecoveryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("initiateReview", () => {
    it("should allow initiating review for AUTO_SUBMITTED attempts", async () => {
      prismaMock.testInstance.findUnique.mockResolvedValue({
        id: "attempt-1",
        status: "AUTO_SUBMITTED",
        userId: "user-1",
      });

      const result = await service.initiateReview(
        "assessment-1",
        "attempt-1",
        "admin-123",
        "admin@test.com",
      );

      expect(result.status).toBe("ADMIN_REVIEW");
      expect(monitoringServiceMock.transitionCandidateState).toHaveBeenCalledWith(
        "assessment-1",
        "attempt-1",
        "ADMIN_REVIEW",
        "admin-123",
        "ADMIN",
        expect.stringContaining("admin@test.com"),
        expect.any(Object),
      );
    });

    it("should reject review if attempt is in active/non-submitted status", async () => {
      prismaMock.testInstance.findUnique.mockResolvedValue({
        id: "attempt-1",
        status: "IN_PROGRESS",
        userId: "user-1",
      });

      await expect(
        service.initiateReview("assessment-1", "attempt-1", "admin-123", "admin@test.com"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("authorizeResume", () => {
    it("should authorize resume, restore checkpoint, and grant extra time", async () => {
      prismaMock.testInstance.findUnique.mockResolvedValue({
        id: "attempt-1",
        status: "AUTO_SUBMITTED",
        userId: "user-1",
        executionState: {
          remainingTimeSeconds: 1200,
          currentSectionKey: "coding",
        },
        submission: [{ id: "sub-1", status: "SUBMITTED" }],
        recoveryLogs: [],
      });

      const result = await service.authorizeResume(
        "assessment-1",
        "attempt-1",
        "admin-123",
        "admin@test.com",
        {
          extraTimeMinutes: 10,
          reason: "Candidate experienced router reset",
        },
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe("RESUME_AUTHORIZED");
      expect(result.extraTimeGrantedSeconds).toBe(600);
      expect(prismaMock.attemptRecoveryLog.create).toHaveBeenCalled();
    });

    it("should prevent concurrent recovery attempts via distributed lock", async () => {
      // Simulate lock already acquired
      locksHeld.add("lock:recovery:attempt-1");

      await expect(
        service.authorizeResume(
          "assessment-1",
          "attempt-1",
          "admin-123",
          "admin@test.com",
          {
            extraTimeMinutes: 5,
            reason: "Duplicate action test",
          },
        ),
      ).rejects.toThrow(ConflictException);
    });

    it("should reject resume if maximum resume count is exceeded", async () => {
      prismaMock.testInstance.findUnique.mockResolvedValue({
        id: "attempt-1",
        status: "AUTO_SUBMITTED",
        userId: "user-1",
        executionState: { remainingTimeSeconds: 1200 },
        recoveryLogs: [
          { newStatus: "RESUME_AUTHORIZED" },
          { newStatus: "RESUME_AUTHORIZED" },
          { newStatus: "RESUME_AUTHORIZED" },
        ],
      });

      await expect(
        service.authorizeResume(
          "assessment-1",
          "attempt-1",
          "admin-123",
          "admin@test.com",
          {
            extraTimeMinutes: 5,
            reason: "Exceeded resumes",
          },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("adminExtendTime", () => {
    it("should grant extra minutes to an active attempt", async () => {
      prismaMock.testInstance.findUnique.mockResolvedValue({
        id: "attempt-1",
        status: "IN_PROGRESS",
        userId: "user-1",
        expiresAt: new Date(Date.now() + 600000),
        executionState: {
          remainingTimeSeconds: 600,
        },
      });

      monitoringServiceMock.getCandidateLiveRecord.mockResolvedValue({
        assessmentId: "assessment-1",
        attemptId: "attempt-1",
        candidateId: "user-1",
        candidateName: "Jane Doe",
        remainingTimeSeconds: 600,
        extraTimeGrantedSeconds: 0,
      });

      const result = await service.adminExtendTime(
        "assessment-1",
        "attempt-1",
        "admin-123",
        "admin@test.com",
        {
          extraMinutes: 15,
          reason: "Compensating for platform glitch",
        },
      );

      expect(result.success).toBe(true);
      expect(result.extraMinutes).toBe(15);
      expect(result.newRemainingSeconds).toBeGreaterThan(600);
      expect(prismaMock.assessmentAuditLog.create).toHaveBeenCalled();
    });
  });
});
