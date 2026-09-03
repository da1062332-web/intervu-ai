import { Test, TestingModule } from "@nestjs/testing";
import { EntitlementService } from "../services/entitlement.service";
import { SubscriptionService } from "../services/subscription.service";
import { UsageQuotaService } from "../services/usage-quota.service";
import { PrismaService } from "../../../prisma/prisma.service";

describe("EntitlementService", () => {
  let service: EntitlementService;
  let mockGetUserSubscription: jest.Mock;
  let mockGetOrCreateCurrentQuota: jest.Mock;
  let mockPrismaPlanFindUnique: jest.Mock;
  let mockPrismaOverrideFindMany: jest.Mock;

  beforeEach(async () => {
    mockGetUserSubscription = jest.fn();
    mockGetOrCreateCurrentQuota = jest.fn().mockResolvedValue({
      id: "q-1",
      userId: "u-1",
      periodKey: "2026-09",
      roundsUsed: 1,
      questionsAttempted: 10,
      exportsUsed: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      subscriptionId: "sub-1",
    });
    mockPrismaPlanFindUnique = jest.fn().mockResolvedValue(null);
    mockPrismaOverrideFindMany = jest.fn().mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntitlementService,
        {
          provide: SubscriptionService,
          useValue: {
            getUserSubscription: mockGetUserSubscription,
          },
        },
        {
          provide: UsageQuotaService,
          useValue: {
            getOrCreateCurrentQuota: mockGetOrCreateCurrentQuota,
          },
        },
        {
          provide: PrismaService,
          useValue: {
            plan: { findUnique: mockPrismaPlanFindUnique },
            userQuotaOverride: { findMany: mockPrismaOverrideFindMany },
          },
        },
      ],
    }).compile();

    service = module.get<EntitlementService>(EntitlementService);
  });

  it("should return incomplete status with no active plan when subscription is missing", async () => {
    mockGetUserSubscription.mockResolvedValue(null);

    const result = await service.getUserEntitlements("u-1");
    expect(result.hasActivePlan).toBe(false);
    expect(result.status).toBe("INCOMPLETE");
    expect(result.plan).toBe("FREE");
    expect(result.features.voiceInterviews).toBe(false);
  });

  it("should resolve Free tier entitlements with quota remaining", async () => {
    mockGetUserSubscription.mockResolvedValue({
      id: "sub-free",
      userId: "u-free",
      plan: "FREE",
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: null,
    });

    const result = await service.getUserEntitlements("u-free");
    expect(result.hasActivePlan).toBe(true);
    expect(result.status).toBe("ACTIVE");
    expect(result.plan).toBe("FREE");
    expect(result.features.monthlyRoundsLimit).toBe(3);
    expect(result.features.monthlyRoundsUsed).toBe(1);
    expect(result.features.monthlyRoundsRemaining).toBe(2);
    expect(result.features.voiceInterviews).toBe(false);
  });

  it("should resolve Pro tier entitlements with unlimited rounds and voice interviews", async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    mockGetUserSubscription.mockResolvedValue({
      id: "sub-pro",
      userId: "u-pro",
      plan: "PRO",
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: futureDate,
    });

    const result = await service.getUserEntitlements("u-pro");
    expect(result.hasActivePlan).toBe(true);
    expect(result.status).toBe("ACTIVE");
    expect(result.plan).toBe("PRO");
    expect(result.features.monthlyRoundsLimit).toBeNull();
    expect(result.features.monthlyRoundsRemaining).toBeNull();
    expect(result.features.voiceInterviews).toBe(true);
    expect(result.features.rubricScoring).toBe("per_criterion");
  });

  it("should detect expired paid plans", async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    mockGetUserSubscription.mockResolvedValue({
      id: "sub-expired",
      userId: "u-expired",
      plan: "PRO",
      status: "ACTIVE",
      currentPeriodStart: new Date(pastDate.getTime() - 30 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: pastDate,
    });

    const result = await service.getUserEntitlements("u-expired");
    expect(result.hasActivePlan).toBe(false);
    expect(result.status).toBe("EXPIRED");
  });
});
