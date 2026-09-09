import { Test, TestingModule } from "@nestjs/testing";
import { CandidateDashboardService } from "./candidate-dashboard.service";
import { CandidateDashboardRepository } from "../repositories/candidate-dashboard.repository";
import { EntitlementService } from "../../billing/services/entitlement.service";

describe("CandidateDashboardService", () => {
  let service: CandidateDashboardService;
  let repository: CandidateDashboardRepository;

  beforeEach(async () => {
    const mockRepository = {
      getDashboardData: jest.fn(),
    };
    const mockEntitlementService = {
      getUserEntitlements: jest.fn().mockResolvedValue({
        plan: "VIP_UNLIMITED",
        hasActivePlan: true,
        features: { allowedAssessments: ["all"] },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidateDashboardService,
        { provide: CandidateDashboardRepository, useValue: mockRepository },
        { provide: EntitlementService, useValue: mockEntitlementService },
      ],
    }).compile();

    service = module.get<CandidateDashboardService>(CandidateDashboardService);
    repository = module.get<CandidateDashboardRepository>(
      CandidateDashboardRepository,
    );
  });

  it("should aggregate and format dashboard data", async () => {
    const mockDate = new Date();

    jest.spyOn(repository, "getDashboardData").mockResolvedValue({
      attemptsByConfig: {},
      activeAttempts: [
        {
          id: "attempt1",
          testConfigId: "test1",
          createdAt: mockDate,
          testConfig: { displayName: "Active Test" },
        } as any,
      ],
      completedTests: [
        {
          id: "attempt2",
          testConfigId: "test2",
          updatedAt: mockDate,
          testConfig: { displayName: "Completed Test" },
          evaluationResult: { overallScore: 90 },
        } as any,
      ],
      enrollments: [
        {
          testId: "test1",
          status: "ENROLLED",
          testConfig: {
            displayName: "Enrolled Test",
            companyName: "Acme",
            totalDurationSeconds: 3600,
            totalQuestions: 10,
          },
        } as any,
      ],
      upcomingTests: [
        {
          id: "test3",
          displayName: "Recommended",
          companyName: "Acme",
          totalDurationSeconds: 1800,
          totalQuestions: 5,
          sections: [],
        } as any,
      ],
    });

    const result = await service.getDashboardData("user1");

    expect(result.activeAttempts).toHaveLength(1);
    expect(result.activeAttempts[0].name).toBe("Active Test");

    expect(result.completedTests).toHaveLength(1);
    expect(result.completedTests[0].score).toBe(90);

    expect(result.upcomingTests).toHaveLength(1);
    expect(result.upcomingTests[0].name).toBe("Enrolled Test");

    expect(result.recommendedTests).toHaveLength(1);
    expect(result.recommendedTests[0].name).toBe("Recommended");
  });

  it("should calculate canReattempt: true when usedAttempts < maxAttempts", async () => {
    (service as any).entitlementService.getUserEntitlements.mockResolvedValue({
      plan: "STANDARD",
      hasActivePlan: true,
      features: { allowedAssessments: ["all"] },
    });

    jest.spyOn(repository, "getDashboardData").mockResolvedValue({
      attemptsByConfig: { test3: 1 },
      activeAttempts: [],
      completedTests: [],
      enrollments: [],
      upcomingTests: [
        {
          id: "test3",
          displayName: "Recommended",
          companyName: "Acme",
          totalDurationSeconds: 1800,
          totalQuestions: 5,
          sections: [],
          ruleFlags: { maxAttempts: 3 },
        } as any,
      ],
    });

    const result = await service.getDashboardData("user1");
    expect(result.recommendedTests).toHaveLength(1);
    expect(result.recommendedTests[0].attemptCount).toBe(1);
    expect(result.recommendedTests[0].canReattempt).toBe(true);
    expect(result.recommendedTests[0].isLocked).toBe(false);
  });

  it("should calculate canReattempt: false and isLocked: true when usedAttempts >= maxAttempts", async () => {
    (service as any).entitlementService.getUserEntitlements.mockResolvedValue({
      plan: "STANDARD",
      hasActivePlan: true,
      features: { allowedAssessments: ["all"] },
    });

    jest.spyOn(repository, "getDashboardData").mockResolvedValue({
      attemptsByConfig: { test3: 3 },
      activeAttempts: [],
      completedTests: [],
      enrollments: [],
      upcomingTests: [
        {
          id: "test3",
          displayName: "Recommended",
          companyName: "Acme",
          totalDurationSeconds: 1800,
          totalQuestions: 5,
          sections: [],
          ruleFlags: { maxAttempts: 3 },
        } as any,
      ],
    });

    const result = await service.getDashboardData("user1");
    expect(result.recommendedTests).toHaveLength(1);
    expect(result.recommendedTests[0].attemptCount).toBe(3);
    expect(result.recommendedTests[0].canReattempt).toBe(false);
    expect(result.recommendedTests[0].isLocked).toBe(true);
  });
});
