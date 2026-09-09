import { Test, TestingModule } from "@nestjs/testing";
import { EligibilityService } from "./eligibility.service";
import { UserRepository } from "../users/repositories/user.repository";
import { TestConfigRepository } from "../tests/repositories/test-config.repository";
import { TestInstanceRepository } from "../tests/test-instance/test-instance.repository";
import { PrismaService } from "../../prisma/prisma.service";
import { EntitlementService } from "../billing/services/entitlement.service";

describe("EligibilityService - FIX-02 Attempt Limit Enforcement", () => {
  let service: EligibilityService;
  let mockUserRepo: any;
  let mockTestConfigRepo: any;
  let mockTestInstanceRepo: any;
  let mockPrisma: any;
  let mockEntitlementService: any;

  const mockExamConfig = {
    id: "exam_config_cuid_123",
    code: "TCS_NQT_SHORT_ASSESSMENT",
    name: "TCS NQT Short Assessment",
    isActive: true,
    status: "PUBLISHED",
    ruleFlags: {
      maxAttempts: 3,
    },
  };

  const mockTestConfig = {
    id: "test_config_cuid_456",
    configKey: "GENERAL_APTITUDE",
    displayName: "General Aptitude",
    isActive: true,
  };

  beforeEach(async () => {
    mockUserRepo = {
      findById: jest.fn().mockResolvedValue({ id: "user_1", email: "user@example.com" }),
    };

    mockTestConfigRepo = {
      findById: jest.fn().mockImplementation((id: string) => {
        if (id === mockTestConfig.id) return Promise.resolve(mockTestConfig);
        return Promise.resolve(null);
      }),
    };

    mockTestInstanceRepo = {
      countAttempts: jest.fn().mockResolvedValue(0),
      findActiveByUser: jest.fn().mockResolvedValue(null),
    };

    mockPrisma = {
      user: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === "vip_user") {
            return Promise.resolve({ id: "vip_user", email: "candidate@intervu.ai", role: "CANDIDATE" });
          }
          return Promise.resolve({ id: where.id, email: "candidate@example.com", role: "CANDIDATE" });
        }),
      },
      examConfig: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === mockExamConfig.id) return Promise.resolve(mockExamConfig);
          return Promise.resolve(null);
        }),
        findFirst: jest.fn().mockImplementation(({ where }) => {
          if (where.code === "TCS_NQT_SHORT_ASSESSMENT") return Promise.resolve(mockExamConfig);
          return Promise.resolve(null);
        }),
      },
      testConfig: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          if (where.configKey === "GENERAL_APTITUDE") return Promise.resolve(mockTestConfig);
          return Promise.resolve(null);
        }),
      },
      testInstance: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === "instance_cuid_789") {
            return Promise.resolve({ examConfigId: mockExamConfig.id, testConfigId: null });
          }
          return Promise.resolve(null);
        }),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      },
      userQuotaOverride: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };

    mockEntitlementService = {
      getUserEntitlements: jest.fn().mockResolvedValue({
        hasActivePlan: true,
        features: {
          allowedAssessments: ["all"],
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EligibilityService,
        { provide: UserRepository, useValue: mockUserRepo },
        { provide: TestConfigRepository, useValue: mockTestConfigRepo },
        { provide: TestInstanceRepository, useValue: mockTestInstanceRepo },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EntitlementService, useValue: mockEntitlementService },
      ],
    }).compile();

    service = module.get<EligibilityService>(EligibilityService);
  });

  describe("1. Resolve by ID", () => {
    it("should resolve ExamConfig by canonical CUID and pass canonical ID to countAttempts", async () => {
      const result = await service.validateEligibility("user_1", mockExamConfig.id);

      expect(result.eligible).toBe(true);
      expect(result.isExamConfig).toBe(true);
      expect(result.resolvedConfigId).toBe(mockExamConfig.id);
      expect(mockTestInstanceRepo.countAttempts).toHaveBeenCalledWith("user_1", mockExamConfig.id);
    });

    it("should resolve TestConfig by canonical ID", async () => {
      const result = await service.validateEligibility("user_1", mockTestConfig.id);

      expect(result.eligible).toBe(true);
      expect(result.isExamConfig).toBe(false);
      expect(result.resolvedConfigId).toBe(mockTestConfig.id);
      expect(mockTestInstanceRepo.countAttempts).toHaveBeenCalledWith("user_1", mockTestConfig.id);
    });
  });

  describe("2. Resolve by Assessment Code & Regression Prevention", () => {
    it("should resolve ExamConfig by assessment code and use canonical config ID for countAttempts", async () => {
      const result = await service.validateEligibility("user_1", "TCS_NQT_SHORT_ASSESSMENT");

      expect(result.eligible).toBe(true);
      expect(result.isExamConfig).toBe(true);
      expect(result.resolvedConfigId).toBe(mockExamConfig.id);

      // CRITICAL: countAttempts must receive canonical ID, NOT the raw code string!
      expect(mockTestInstanceRepo.countAttempts).toHaveBeenCalledWith("user_1", mockExamConfig.id);
      expect(mockTestInstanceRepo.countAttempts).not.toHaveBeenCalledWith("user_1", "TCS_NQT_SHORT_ASSESSMENT");
    });

    it("should resolve TestConfig by configKey and use canonical config ID for countAttempts", async () => {
      const result = await service.validateEligibility("user_1", "GENERAL_APTITUDE");

      expect(result.eligible).toBe(true);
      expect(result.resolvedConfigId).toBe(mockTestConfig.id);
      expect(mockTestInstanceRepo.countAttempts).toHaveBeenCalledWith("user_1", mockTestConfig.id);
    });

    it("should resolve parent config ID if input is a TestInstance ID", async () => {
      const result = await service.validateEligibility("user_1", "instance_cuid_789");

      expect(result.eligible).toBe(true);
      expect(result.resolvedConfigId).toBe(mockExamConfig.id);
      expect(mockTestInstanceRepo.countAttempts).toHaveBeenCalledWith("user_1", mockExamConfig.id);
    });
  });

  describe("3-6. Attempt Limit Boundary Enforcement", () => {
    it("case 3: non-exhausted (used = 0, max = 3) -> eligible", async () => {
      mockTestInstanceRepo.countAttempts.mockResolvedValue(0);

      const result = await service.validateEligibility("user_1", mockExamConfig.id);

      expect(result.eligible).toBe(true);
      expect(result.errorCode).toBeUndefined();
    });

    it("case 4: partially used (used = 1, max = 3) -> eligible", async () => {
      mockTestInstanceRepo.countAttempts.mockResolvedValue(1);

      const result = await service.validateEligibility("user_1", mockExamConfig.id);

      expect(result.eligible).toBe(true);
    });

    it("case 4b: partially used (used = 2, max = 3) -> eligible", async () => {
      mockTestInstanceRepo.countAttempts.mockResolvedValue(2);

      const result = await service.validateEligibility("user_1", mockExamConfig.id);

      expect(result.eligible).toBe(true);
    });

    it("case 5: exactly exhausted (used = 3, max = 3) -> ineligible with ATTEMPT_LIMIT_REACHED", async () => {
      mockTestInstanceRepo.countAttempts.mockResolvedValue(3);

      const result = await service.validateEligibility("user_1", mockExamConfig.id);

      expect(result.eligible).toBe(false);
      expect(result.errorCode).toBe("ATTEMPT_LIMIT_REACHED");
      expect(result.reason).toContain("Maximum attempts (3) reached");
    });

    it("case 6: over limit (used = 4, max = 3) -> ineligible with ATTEMPT_LIMIT_REACHED", async () => {
      mockTestInstanceRepo.countAttempts.mockResolvedValue(4);

      const result = await service.validateEligibility("user_1", "TCS_NQT_SHORT_ASSESSMENT");

      expect(result.eligible).toBe(false);
      expect(result.errorCode).toBe("ATTEMPT_LIMIT_REACHED");
    });
  });

  describe("7. Plan / Override Attempt Limit Enforcement", () => {
    it("should honor attemptsPerExam from subscription features override", async () => {
      mockEntitlementService.getUserEntitlements.mockResolvedValue({
        hasActivePlan: true,
        features: {
          allowedAssessments: {
            assessments: ["all"],
            attemptsPerExam: 5,
          },
        },
      });

      // 3 attempts used, plan allows 5 -> still eligible
      mockTestInstanceRepo.countAttempts.mockResolvedValue(3);
      const res1 = await service.validateEligibility("user_1", mockExamConfig.id);
      expect(res1.eligible).toBe(true);

      // 5 attempts used -> now exhausted
      mockTestInstanceRepo.countAttempts.mockResolvedValue(5);
      const res2 = await service.validateEligibility("user_1", mockExamConfig.id);
      expect(res2.eligible).toBe(false);
      expect(res2.errorCode).toBe("ATTEMPT_LIMIT_REACHED");
    });
  });

  describe("8. VIP / Test Account Handling", () => {
    it("should allow VIP users to bypass attempt limits", async () => {
      mockTestInstanceRepo.countAttempts.mockResolvedValue(10);

      const result = await service.validateEligibility("vip_user", mockExamConfig.id);

      expect(result.eligible).toBe(true);
      expect(result.resolvedConfigId).toBe(mockExamConfig.id);
    });
  });
});
