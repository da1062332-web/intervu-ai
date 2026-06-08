import { Test, TestingModule } from "@nestjs/testing";
import { DashboardController } from "@/modules/dashboard/controllers/dashboard.controller";
import { DashboardService } from "@/modules/dashboard/services/dashboard.service";
import type { DashboardResponseDto } from "@/modules/dashboard/dto/dashboard-response.dto";
import type { AuthUser } from "@/modules/auth/interfaces/auth-user.interface";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_USER: AuthUser = {
  id: "user-integration",
  email: "candidate@test.com",
  role: "CANDIDATE",
};

const MOCK_DASHBOARD_RESPONSE: DashboardResponseDto = {
  availableTests: [
    {
      configId: "template-001",
      company: "Acme Corp",
      name: "Senior Frontend Interview",
      difficulty: "MEDIUM",
      duration: 3600,
      sections: ["JS", "React"],
    },
  ],
  activeTests: [
    {
      instanceId: "test-active-001",
      configId: "template-001",
      name: "Senior Frontend Interview",
      startedAt: "2026-06-08T03:00:00.000Z",
      timeRemainingSeconds: 3240,
    },
  ],
  completedAttempts: [
    {
      instanceId: "test-done-001",
      configId: "template-001",
      name: "Senior Frontend Interview",
      score: 90,
      submittedAt: "2026-06-07T11:00:00.000Z",
    },
  ],
};

// ─── Mock Service ─────────────────────────────────────────────────────────────

const mockDashboardService = {
  getDashboard: jest.fn(),
  getStats: jest.fn(),
  getAnalyticsSummary: jest.fn(),
  getRecentActivity: jest.fn(),
};

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("DashboardController Integration — getDashboard", () => {
  let controller: DashboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: DashboardService, useValue: mockDashboardService },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  // ─── Response shape ────────────────────────────────────────────────────────

  it("returns the full dashboard response from the service", async () => {
    mockDashboardService.getDashboard.mockResolvedValue(MOCK_DASHBOARD_RESPONSE);

    const result = await controller.getDashboard(MOCK_USER);

    expect(result).toEqual(MOCK_DASHBOARD_RESPONSE);
  });

  it("response contains all three required array keys", async () => {
    mockDashboardService.getDashboard.mockResolvedValue(MOCK_DASHBOARD_RESPONSE);

    const result = await controller.getDashboard(MOCK_USER);

    expect(Array.isArray(result.availableTests)).toBe(true);
    expect(Array.isArray(result.activeTests)).toBe(true);
    expect(Array.isArray(result.completedAttempts)).toBe(true);
  });

  // ─── Service delegation ────────────────────────────────────────────────────

  it("calls getDashboard with the authenticated user id", async () => {
    mockDashboardService.getDashboard.mockResolvedValue(MOCK_DASHBOARD_RESPONSE);

    await controller.getDashboard(MOCK_USER);

    expect(mockDashboardService.getDashboard).toHaveBeenCalledWith(MOCK_USER.id);
    expect(mockDashboardService.getDashboard).toHaveBeenCalledTimes(1);
  });

  // ─── Ownership validation ──────────────────────────────────────────────────

  it("passes ONLY the requesting user id to the service — no cross-user leakage", async () => {
    mockDashboardService.getDashboard.mockResolvedValue(MOCK_DASHBOARD_RESPONSE);

    const otherUser: AuthUser = {
      id: "other-user-999",
      email: "other@test.com",
      role: "CANDIDATE",
    };
    await controller.getDashboard(otherUser);

    expect(mockDashboardService.getDashboard).toHaveBeenCalledWith("other-user-999");
    expect(mockDashboardService.getDashboard).not.toHaveBeenCalledWith(MOCK_USER.id);
  });

  // ─── Empty state ───────────────────────────────────────────────────────────

  it("returns empty arrays when service returns empty dashboard", async () => {
    const emptyDashboard: DashboardResponseDto = {
      availableTests: [],
      activeTests: [],
      completedAttempts: [],
    };
    mockDashboardService.getDashboard.mockResolvedValue(emptyDashboard);

    const result = await controller.getDashboard(MOCK_USER);

    expect(result.availableTests).toHaveLength(0);
    expect(result.activeTests).toHaveLength(0);
    expect(result.completedAttempts).toHaveLength(0);
  });

  // ─── Error propagation ─────────────────────────────────────────────────────

  it("propagates errors from the service without swallowing them", async () => {
    const serviceError = new Error("Service failure");
    mockDashboardService.getDashboard.mockRejectedValue(serviceError);

    await expect(controller.getDashboard(MOCK_USER)).rejects.toThrow(
      "Service failure",
    );
  });
});
