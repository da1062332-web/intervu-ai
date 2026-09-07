import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { SubscriptionService } from "../services/subscription.service";
import { EntitlementService } from "../services/entitlement.service";
import { UsageQuotaService } from "../services/usage-quota.service";
import { PlanManagementService } from "../services/plan-management.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { SubscriptionStatus } from "@prisma/client";
import { EligibilityService } from "../../lifecycle/eligibility.service";
import { UserRepository } from "../../users/repositories/user.repository";
import { TestConfigRepository } from "../../tests/repositories/test-config.repository";
import { TestInstanceRepository } from "../../tests/test-instance/test-instance.repository";

describe("Quota-Driven Subscription & Entitlement Lifecycle", () => {
  let subscriptionService: SubscriptionService;
  let entitlementService: EntitlementService;
  let usageQuotaService: UsageQuotaService;
  let eligibilityService: EligibilityService;

  // Mock in-memory state
  const mockDb = {
    users: new Map<string, any>(),
    subscriptions: new Map<string, any>(),
    usageQuotas: new Map<string, any>(),
    userQuotaOverrides: new Map<string, any[]>(),
    examConfigs: new Map<string, any>(),
    testInstances: new Map<string, any[]>(),
    plans: new Map<string, any>(),
  };

  const mockPrisma: any = {
    user: {
      findUnique: jest.fn(({ where }) => Promise.resolve(mockDb.users.get(where.id) || null)),
      count: jest.fn(() => Promise.resolve(1)),
    },
    subscription: {
      findUnique: jest.fn(({ where }) => {
        if (where.userId) {
          const sub = mockDb.subscriptions.get(where.userId);
          if (sub) {
            return Promise.resolve({
              ...sub,
              usageQuotas: Array.from(mockDb.usageQuotas.values()).filter(
                (q) => q.userId === where.userId,
              ),
            });
          }
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      }),
      upsert: jest.fn(({ where, create, update }) => {
        const existing = mockDb.subscriptions.get(where.userId);
        const saved = {
          id: existing?.id || `sub_${Date.now()}`,
          userId: where.userId,
          ...(existing ? update : create),
          createdAt: existing?.createdAt || new Date(),
          updatedAt: new Date(),
        };
        mockDb.subscriptions.set(where.userId, saved);
        return Promise.resolve(saved);
      }),
      update: jest.fn(({ where, data }) => {
        for (const [userId, sub] of mockDb.subscriptions.entries()) {
          if (sub.id === where.id || userId === where.userId) {
            const updated = { ...sub, ...data, updatedAt: new Date() };
            mockDb.subscriptions.set(userId, updated);
            return Promise.resolve(updated);
          }
        }
        return Promise.resolve(null);
      }),
    },
    usageQuota: {
      findUnique: jest.fn(({ where }) => {
        const key = `${where.userId_periodKey.userId}_${where.userId_periodKey.periodKey}`;
        return Promise.resolve(mockDb.usageQuotas.get(key) || null);
      }),
      findFirst: jest.fn(({ where }) => {
        for (const quota of mockDb.usageQuotas.values()) {
          if (quota.userId === where.userId) {
            return Promise.resolve(quota);
          }
        }
        return Promise.resolve(null);
      }),
      create: jest.fn(({ data }) => {
        const key = `${data.userId}_${data.periodKey}`;
        const quota = { id: `q_${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
        mockDb.usageQuotas.set(key, quota);
        return Promise.resolve(quota);
      }),
      update: jest.fn(({ where, data }) => {
        for (const [key, quota] of mockDb.usageQuotas.entries()) {
          if (quota.id === where.id) {
            if (data.roundsUsed?.increment) {
              quota.roundsUsed += data.roundsUsed.increment;
            }
            quota.updatedAt = new Date();
            mockDb.usageQuotas.set(key, quota);
            return Promise.resolve(quota);
          }
        }
        return Promise.resolve(null);
      }),
    },
    userQuotaOverride: {
      findMany: jest.fn(({ where }) => {
        return Promise.resolve(mockDb.userQuotaOverrides.get(where.userId) || []);
      }),
      findFirst: jest.fn(({ where }) => {
        const list = mockDb.userQuotaOverrides.get(where.userId) || [];
        return Promise.resolve(list[0] || null);
      }),
    },
    plan: {
      findFirst: jest.fn(({ where }) => {
        const slug = where?.slug || where?.OR?.find((c: any) => c.slug)?.slug;
        if (slug && mockDb.plans.has(String(slug).toLowerCase())) {
          return Promise.resolve(mockDb.plans.get(String(slug).toLowerCase()));
        }
        return Promise.resolve(null);
      }),
      findMany: jest.fn(() => Promise.resolve(Array.from(mockDb.plans.values()))),
    },
    testInstance: {
      count: jest.fn(({ where }) => {
        const list = mockDb.testInstances.get(where.userId) || [];
        return Promise.resolve(list.length);
      }),
      findFirst: jest.fn(() => Promise.resolve(null)),
      update: jest.fn(),
    },
    examConfig: {
      findUnique: jest.fn(({ where }) => Promise.resolve(mockDb.examConfigs.get(where.id) || null)),
      findMany: jest.fn(() => Promise.resolve([])),
    },
    paymentTransaction: {
      findFirst: jest.fn(() => Promise.resolve(null)),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        SubscriptionService,
        EntitlementService,
        UsageQuotaService,
        PlanManagementService,
        EligibilityService,
        {
          provide: UserRepository,
          useValue: {
            findById: jest.fn((id) => Promise.resolve(mockDb.users.get(id) || null)),
          },
        },
        {
          provide: TestConfigRepository,
          useValue: {
            findById: jest.fn(() => Promise.resolve(null)),
          },
        },
        {
          provide: TestInstanceRepository,
          useValue: {
            findActiveByUser: jest.fn(() => Promise.resolve(null)),
            countAttempts: jest.fn(() => Promise.resolve(0)),
          },
        },
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => "test"),
          },
        },
      ],
    }).compile();

    subscriptionService = module.get<SubscriptionService>(SubscriptionService);
    entitlementService = module.get<EntitlementService>(EntitlementService);
    usageQuotaService = module.get<UsageQuotaService>(UsageQuotaService);
    eligibilityService = module.get<EligibilityService>(EligibilityService);
  });

  beforeEach(() => {
    mockDb.users.clear();
    mockDb.subscriptions.clear();
    mockDb.usageQuotas.clear();
    mockDb.userQuotaOverrides.clear();
    mockDb.examConfigs.clear();
    mockDb.testInstances.clear();
    mockDb.plans.clear();
  });

  it("1. Quota > 0: Plan remains ACTIVE and assessments are allowed", async () => {
    const userId = "candidate-quota-1";
    mockDb.users.set(userId, { id: userId, email: "user1@test.com", role: "CANDIDATE" });

    // Setup active subscription for custom 5-attempt package
    const subId = "sub-pkg-5";
    mockDb.subscriptions.set(userId, {
      id: subId,
      userId,
      plan: "TCS_NQT_PACK",
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: null, // No calendar expiry
    });

    // Configure dynamic plan in DB with 5 assessment attempts limit
    mockDb.plans.set("tcs_nqt_pack", {
      id: "plan-tcs-5",
      slug: "tcs_nqt_pack",
      name: "TCS NQT 5-Pack",
      features: [
        { featureKey: "rounds_limit", valueJson: 5 },
        { featureKey: "voice_interviews", valueJson: true },
      ],
    });

    // 0 rounds used so far
    const entitlements = await entitlementService.getUserEntitlements(userId);
    expect(entitlements.hasActivePlan).toBe(true);
    expect(entitlements.status).toBe("ACTIVE");
    expect(entitlements.features.monthlyRoundsLimit).toBe(5);
    expect(entitlements.features.monthlyRoundsRemaining).toBe(5);

    const hasQuota = await entitlementService.hasRoundQuota(userId);
    expect(hasQuota).toBe(true);
  });

  it("2. Quota Consumption: Consuming rounds updates persistent quota against subscription key without calendar reset", async () => {
    const userId = "candidate-quota-2";
    const subId = "sub-pkg-custom";
    mockDb.users.set(userId, { id: userId, email: "user2@test.com", role: "CANDIDATE" });

    mockDb.subscriptions.set(userId, {
      id: subId,
      userId,
      plan: "CUSTOM_PACK",
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: null,
    });

    mockDb.plans.set("custom_pack", {
      id: "plan-custom-pack",
      slug: "custom_pack",
      name: "Custom 2-Assessment Pack",
      features: [{ featureKey: "rounds_limit", valueJson: 2 }],
    });

    // Consume round 1
    const res1 = await entitlementService.consumeRound(userId);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(1);

    // Verify quota key used is persistent subscription ID `sub_${subId}`
    const quotaKey = `sub_${subId}`;
    const quotaRecord = mockDb.usageQuotas.get(`${userId}_${quotaKey}`);
    expect(quotaRecord).toBeDefined();
    expect(quotaRecord.roundsUsed).toBe(1);

    // Entitlements should reflect 1 remaining and active
    const ent1 = await entitlementService.getUserEntitlements(userId);
    expect(ent1.hasActivePlan).toBe(true);
    expect(ent1.status).toBe("ACTIVE");
    expect(ent1.features.monthlyRoundsRemaining).toBe(1);
  });

  it("3. Quota = 0: Plan automatically marks as EXPIRED and blocks further assessments", async () => {
    const userId = "candidate-quota-3";
    const subId = "sub-pkg-1";
    mockDb.users.set(userId, { id: userId, email: "user3@test.com", role: "CANDIDATE" });

    mockDb.subscriptions.set(userId, {
      id: subId,
      userId,
      plan: "SINGLE_PACK",
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: null,
    });

    mockDb.plans.set("single_pack", {
      id: "plan-single",
      slug: "single_pack",
      name: "Single Assessment Pack",
      features: [{ featureKey: "rounds_limit", valueJson: 1 }],
    });

    // Consume the 1 available round
    const res1 = await entitlementService.consumeRound(userId);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(0);

    // Next round attempt is blocked
    const res2 = await entitlementService.consumeRound(userId);
    expect(res2.allowed).toBe(false);
    expect(res2.remaining).toBe(0);

    // Entitlements now report EXPIRED and hasActivePlan: false
    const entExhausted = await entitlementService.getUserEntitlements(userId);
    expect(entExhausted.hasActivePlan).toBe(false);
    expect(entExhausted.status).toBe("EXPIRED");
    expect(entExhausted.features.monthlyRoundsRemaining).toBe(0);

    // Subscription status also reports EXPIRED
    const subStatus = await subscriptionService.getSubscriptionStatus(userId);
    expect(subStatus.hasActivePlan).toBe(false);
    expect(subStatus.status).toBe(SubscriptionStatus.EXPIRED);

    // Eligibility check rejects with QUOTA_EXHAUSTED
    mockDb.examConfigs.set("exam-1", {
      id: "exam-1",
      isActive: true,
      status: "PUBLISHED",
      ruleFlags: { maxAttempts: 5 },
    });

    const eligibility = await eligibilityService.validateEligibility(userId, "exam-1");
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.errorCode).toBe("QUOTA_EXHAUSTED");
    expect(eligibility.reason).toBe("Your assessment quota has been exhausted. Purchase a new plan to continue.");
  });

  it("4. Referral / Free Credit lifecycle: active while attempts > 0, consumed when 0", async () => {
    const userId = "candidate-referral-1";
    mockDb.users.set(userId, { id: userId, email: "referral@test.com", role: "CANDIDATE" });

    // No paid subscription, but user has an active referral override with 1 bonus round
    mockDb.userQuotaOverrides.set(userId, [
      {
        id: "ov-1",
        userId,
        featureKey: "allowed_assessments",
        overrideValue: { assessments: ["exam-tcs"], attemptsPerExam: 1 },
        reason: "Referral Reward - TCS Exam",
        expiresAt: null,
      },
    ]);

    // Check entitlements before attempt
    const entBefore = await entitlementService.getUserEntitlements(userId);
    expect(entBefore.hasActivePlan).toBe(true);
    expect(entBefore.status).toBe("ACTIVE");
    expect(entBefore.planSlug).toBe("referral-pass");
    expect(entBefore.features.monthlyRoundsRemaining).toBe(1);

    // User completes 1 attempt
    mockDb.testInstances.set(userId, [
      { id: "ti-1", userId, examConfigId: "exam-tcs", status: "COMPLETED" },
    ]);

    // Check entitlements after attempt: reward is now fully consumed
    const entAfter = await entitlementService.getUserEntitlements(userId);
    expect(entAfter.hasActivePlan).toBe(false);
    expect(entAfter.status).toBe("INCOMPLETE");
    expect(entAfter.features.monthlyRoundsRemaining).toBe(0);
  });
});
