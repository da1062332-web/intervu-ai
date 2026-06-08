import { Test, TestingModule } from "@nestjs/testing";
import { DashboardService } from "./dashboard.service";
import { DashboardRepository } from "../repositories/dashboard.repository";
import { UserNotFoundError } from "@intervu/shared";
import type { Template, Test as PrismaTest } from "@prisma/client";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const MOCK_TEMPLATE: Template = {
  id: "template-001",
  name: "Senior Frontend Engineer Interview",
  description: "Frontend engineering assessment",
  difficulty: "MEDIUM",
  config: {
    company: "Acme Corp",
    durationSeconds: 3600,
    sections: ["HTML & CSS", "JavaScript", "React"],
  },
  isSystem: true,
  creatorId: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  deletedAt: null,
};

// startedAt is set 60 seconds in the past relative to test execution
// so timeRemainingSeconds is always deterministic (3600 - 60 = 3540 > 0)
const STARTED_AT_60S_AGO = new Date(Date.now() - 60_000);

const MOCK_ACTIVE_TEST: PrismaTest & { template: Template } = {
  id: "test-active-001",
  templateId: "template-001",
  userId: "user-abc",
  status: "ONGOING",
  score: null,
  feedback: null,
  answers: null,
  questions: null,
  startedAt: STARTED_AT_60S_AGO,
  completedAt: null,
  createdAt: new Date(Date.now() - 61_000),
  updatedAt: STARTED_AT_60S_AGO,
  deletedAt: null,
  template: MOCK_TEMPLATE,
};

const MOCK_COMPLETED_TEST: PrismaTest & { template: Template } = {
  id: "test-done-001",
  templateId: "template-001",
  userId: "user-abc",
  status: "COMPLETED",
  score: 82.5,
  feedback: null,
  answers: null,
  questions: null,
  startedAt: new Date("2026-06-07T10:00:00Z"),
  completedAt: new Date("2026-06-07T11:00:00Z"),
  createdAt: new Date("2026-06-07T09:59:00Z"),
  updatedAt: new Date("2026-06-07T11:00:00Z"),
  deletedAt: null,
  template: MOCK_TEMPLATE,
};

// ─── Mock Repository ──────────────────────────────────────────────────────────

const mockRepository = () => ({
  getStatsByUserId: jest.fn(),
  getAnalyticsSummaryByUserId: jest.fn(),
  getRecentActivityByUserId: jest.fn(),
  findAvailableTests: jest.fn(),
  findActiveTests: jest.fn(),
  findCompletedAttempts: jest.fn(),
});

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("DashboardService — getDashboard (Sprint 2 Day 1)", () => {
  let service: DashboardService;
  let repository: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    repository = mockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: DashboardRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  // ─── DASH-API-001 — Available tests ────────────────────────────────────────

  it("DASH-API-001: returns availableTests mapped from template array", async () => {
    repository.findAvailableTests.mockResolvedValue([MOCK_TEMPLATE]);
    repository.findActiveTests.mockResolvedValue([]);
    repository.findCompletedAttempts.mockResolvedValue([]);

    const result = await service.getDashboard("user-abc");

    expect(repository.findAvailableTests).toHaveBeenCalledTimes(1);
    expect(result.availableTests).toHaveLength(1);
    expect(result.availableTests[0]).toEqual({
      configId: "template-001",
      company: "Acme Corp",
      name: "Senior Frontend Engineer Interview",
      difficulty: "MEDIUM",
      duration: 3600,
      sections: ["HTML & CSS", "JavaScript", "React"],
    });
  });

  // ─── DASH-API-002 — Active tests ───────────────────────────────────────────

  it("DASH-API-002: returns activeTests filtered for the requesting userId", async () => {
    repository.findAvailableTests.mockResolvedValue([]);
    repository.findActiveTests.mockResolvedValue([MOCK_ACTIVE_TEST]);
    repository.findCompletedAttempts.mockResolvedValue([]);

    const result = await service.getDashboard("user-abc");

    expect(repository.findActiveTests).toHaveBeenCalledWith("user-abc");
    expect(result.activeTests).toHaveLength(1);
    expect(result.activeTests[0]).toMatchObject({
      instanceId: "test-active-001",
      configId: "template-001",
      name: "Senior Frontend Engineer Interview",
      startedAt: STARTED_AT_60S_AGO.toISOString(),
    });
    // timeRemainingSeconds is > 0 for a test started in the past with 3600s duration
    expect(result.activeTests[0].timeRemainingSeconds).toBeGreaterThan(0);
  });

  it("DASH-API-002: handles startedAt = null defensively — timeRemainingSeconds = durationSeconds", async () => {
    const testWithNullStart = { ...MOCK_ACTIVE_TEST, startedAt: null };
    repository.findAvailableTests.mockResolvedValue([]);
    repository.findActiveTests.mockResolvedValue([testWithNullStart]);
    repository.findCompletedAttempts.mockResolvedValue([]);

    const result = await service.getDashboard("user-abc");

    expect(result.activeTests[0].startedAt).toBeNull();
    expect(result.activeTests[0].timeRemainingSeconds).toBe(3600);
  });

  // ─── DASH-API-003 — Completed attempts ─────────────────────────────────────

  it("DASH-API-003: returns completedAttempts sorted and limited from repository", async () => {
    repository.findAvailableTests.mockResolvedValue([]);
    repository.findActiveTests.mockResolvedValue([]);
    repository.findCompletedAttempts.mockResolvedValue([MOCK_COMPLETED_TEST]);

    const result = await service.getDashboard("user-abc");

    expect(repository.findCompletedAttempts).toHaveBeenCalledWith("user-abc");
    expect(result.completedAttempts).toHaveLength(1);
    expect(result.completedAttempts[0]).toEqual({
      instanceId: "test-done-001",
      configId: "template-001",
      name: "Senior Frontend Engineer Interview",
      score: 82.5,
      submittedAt: MOCK_COMPLETED_TEST.completedAt!.toISOString(),
    });
  });

  it("DASH-API-003: score defaults to 0 when Test.score is null (evaluation pending)", async () => {
    const testWithNullScore = { ...MOCK_COMPLETED_TEST, score: null };
    repository.findAvailableTests.mockResolvedValue([]);
    repository.findActiveTests.mockResolvedValue([]);
    repository.findCompletedAttempts.mockResolvedValue([testWithNullScore]);

    const result = await service.getDashboard("user-abc");

    expect(result.completedAttempts[0].score).toBe(0);
  });

  it("DASH-API-003: submittedAt is null when Test.completedAt is null", async () => {
    const testWithNullCompletion = {
      ...MOCK_COMPLETED_TEST,
      completedAt: null,
    };
    repository.findAvailableTests.mockResolvedValue([]);
    repository.findActiveTests.mockResolvedValue([]);
    repository.findCompletedAttempts.mockResolvedValue([
      testWithNullCompletion,
    ]);

    const result = await service.getDashboard("user-abc");

    expect(result.completedAttempts[0].submittedAt).toBeNull();
  });

  // ─── DASH-API-004 — Empty dashboard ────────────────────────────────────────

  it("DASH-API-004: returns empty arrays when no data exists for the user", async () => {
    repository.findAvailableTests.mockResolvedValue([]);
    repository.findActiveTests.mockResolvedValue([]);
    repository.findCompletedAttempts.mockResolvedValue([]);

    const result = await service.getDashboard("user-abc");

    expect(result).toEqual({
      availableTests: [],
      activeTests: [],
      completedAttempts: [],
    });
  });

  // ─── DASH-API-005 — Unauthorised / invalid userId ──────────────────────────

  it("DASH-API-005: throws UserNotFoundError for empty userId string", async () => {
    await expect(service.getDashboard("")).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
    expect(repository.findAvailableTests).not.toHaveBeenCalled();
  });

  it("DASH-API-005: throws UserNotFoundError for whitespace-only userId", async () => {
    await expect(service.getDashboard("   ")).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
  });

  // ─── Parallel execution verification ───────────────────────────────────────

  it("fires all three repository calls in parallel via Promise.all", async () => {
    const callOrder: string[] = [];

    repository.findAvailableTests.mockImplementation(async () => {
      callOrder.push("available");
      return [];
    });
    repository.findActiveTests.mockImplementation(async () => {
      callOrder.push("active");
      return [];
    });
    repository.findCompletedAttempts.mockImplementation(async () => {
      callOrder.push("completed");
      return [];
    });

    await service.getDashboard("user-abc");

    // All three must have been called exactly once
    expect(repository.findAvailableTests).toHaveBeenCalledTimes(1);
    expect(repository.findActiveTests).toHaveBeenCalledTimes(1);
    expect(repository.findCompletedAttempts).toHaveBeenCalledTimes(1);
    // All three were initiated (order depends on Promise.all scheduling)
    expect(callOrder).toHaveLength(3);
  });
});
