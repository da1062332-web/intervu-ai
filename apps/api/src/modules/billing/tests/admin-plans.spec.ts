import { Test, TestingModule } from "@nestjs/testing";
import { AdminPlansController } from "../controllers/admin-plans.controller";
import { PlanManagementService } from "../services/plan-management.service";
import { PrismaService } from "../../../prisma/prisma.service";

describe("AdminPlansController & PlanManagementService", () => {
  let controller: AdminPlansController;
  let service: PlanManagementService;

  const mockPlan = {
    id: "plan-1",
    slug: "starter",
    name: "Starter Plan",
    description: "Basic features",
    priceMonthly: 9900,
    priceYearly: null,
    currency: "INR",
    badge: "NEW",
    isHighlighted: false,
    buttonText: "Get Started",
    isActive: true,
    sortOrder: 1,
    features: [
      {
        id: "feat-1",
        planId: "plan-1",
        featureKey: "monthly_rounds_limit",
        featureName: "5 Tests / Month",
        valueType: "NUMBER",
        valueJson: 5,
        description: "Practice limit",
        sortOrder: 0,
      },
    ],
  };

  const mockPrisma = {
    plan: {
      findMany: jest.fn().mockResolvedValue([mockPlan]),
      findUnique: jest.fn().mockResolvedValue(mockPlan),
      create: jest.fn().mockResolvedValue(mockPlan),
      update: jest.fn().mockResolvedValue(mockPlan),
      delete: jest.fn().mockResolvedValue(mockPlan),
    },
    planFeature: {
      create: jest.fn().mockResolvedValue(mockPlan.features[0]),
      findFirst: jest.fn().mockResolvedValue(mockPlan.features[0]),
      update: jest.fn().mockResolvedValue(mockPlan.features[0]),
      delete: jest.fn().mockResolvedValue(mockPlan.features[0]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminPlansController],
      providers: [
        PlanManagementService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    controller = module.get<AdminPlansController>(AdminPlansController);
    service = module.get<PlanManagementService>(PlanManagementService);
  });

  it("should list all plans with features", async () => {
    const result = await controller.getPlans();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("starter");
    expect(result[0].features).toHaveLength(1);
  });

  it("should create a new dynamic plan", async () => {
    mockPrisma.plan.findUnique.mockResolvedValueOnce(null); // slug not taken
    const result = await controller.createPlan({
      slug: "starter",
      name: "Starter Plan",
      priceMonthly: 9900,
      currency: "INR",
      isHighlighted: false,
      buttonText: "Get Started",
      isActive: true,
      sortOrder: 1,
    });
    expect(result.name).toBe("Starter Plan");
  });

  it("should add a dynamic limitation rule to a plan", async () => {
    const result = await controller.addFeature("plan-1", {
      featureKey: "monthly_rounds_limit",
      featureName: "5 Tests / Month",
      valueType: "NUMBER",
      valueJson: 5,
      sortOrder: 0,
    });
    expect(result.featureKey).toBe("monthly_rounds_limit");
  });

  it("should delete a limitation from a plan", async () => {
    const result = await controller.deleteFeature("plan-1", "feat-1");
    expect(result.id).toBe("feat-1");
  });
});
