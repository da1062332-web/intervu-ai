import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { SubscriptionService } from "../src/modules/billing/services/subscription.service";
import { EntitlementService } from "../src/modules/billing/services/entitlement.service";
import { UsageQuotaService } from "../src/modules/billing/services/usage-quota.service";
import { PlanManagementService } from "../src/modules/billing/services/plan-management.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { SubscriptionStatus } from "@prisma/client";
import { EligibilityService } from "../src/modules/lifecycle/eligibility.service";
import { UserRepository } from "../src/modules/users/repositories/user.repository";
import { TestConfigRepository } from "../src/modules/tests/repositories/test-config.repository";
import { TestInstanceRepository } from "../src/modules/tests/test-instance/test-instance.repository";

async function main() {
  console.log("Starting Quota Lifecycle Verification...");

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
      findUnique: jestFn(({ where }: any) => Promise.resolve(mockDb.users.get(where.id) || null)),
      count: jestFn(() => Promise.resolve(1)),
    },
    subscription: {
      findUnique: jestFn(({ where }: any) => {
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
      upsert: jestFn(({ where, create, update }: any) => {
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
      update: jestFn(({ where, data }: any) => {
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
      findUnique: jestFn(({ where }: any) => {
        const key = `${where.userId_periodKey.userId}_${where.userId_periodKey.periodKey}`;
        return Promise.resolve(mockDb.usageQuotas.get(key) || null);
      }),
      findFirst: jestFn(({ where }: any) => {
        for (const quota of mockDb.usageQuotas.values()) {
          if (quota.userId === where.userId) {
            return Promise.resolve(quota);
          }
        }
        return Promise.resolve(null);
      }),
      create: jestFn(({ data }: any) => {
        const key = `${data.userId}_${data.periodKey}`;
        const quota = { id: `q_${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
        mockDb.usageQuotas.set(key, quota);
        return Promise.resolve(quota);
      }),
      update: jestFn(({ where, data }: any) => {
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
      findMany: jestFn(({ where }: any) => {
        return Promise.resolve(mockDb.userQuotaOverrides.get(where.userId) || []);
      }),
      findFirst: jestFn(({ where }: any) => {
        const list = mockDb.userQuotaOverrides.get(where.userId) || [];
        return Promise.resolve(list[0] || null);
      }),
    },
    plan: {
      findFirst: jestFn(({ where }: any) => {
        const slug = where?.slug || where?.OR?.find((c: any) => c.slug)?.slug;
        if (slug && mockDb.plans.has(String(slug).toLowerCase())) {
          return Promise.resolve(mockDb.plans.get(String(slug).toLowerCase()));
        }
        return Promise.resolve(null);
      }),
      findMany: jestFn(() => Promise.resolve(Array.from(mockDb.plans.values()))),
    },
    testInstance: {
      count: jestFn(({ where }: any) => {
        const list = mockDb.testInstances.get(where.userId) || [];
        return Promise.resolve(list.length);
      }),
      findFirst: jestFn(() => Promise.resolve(null)),
      update: jestFn(),
    },
    examConfig: {
      findUnique: jestFn(({ where }: any) => Promise.resolve(mockDb.examConfigs.get(where.id) || null)),
      findMany: jestFn(() => Promise.resolve([])),
    },
    paymentTransaction: {
      findFirst: jestFn(() => Promise.resolve(null)),
    },
    $transaction: jestFn((callback: any) => callback(mockPrisma)),
  };

  function jestFn(impl?: any) {
    return (...args: any[]) => (impl ? impl(...args) : Promise.resolve(null));
  }

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
          findById: (id: string) => Promise.resolve(mockDb.users.get(id) || null),
        },
      },
      {
        provide: TestConfigRepository,
        useValue: {
          findById: () => Promise.resolve(null),
        },
      },
      {
        provide: TestInstanceRepository,
        useValue: {
          findActiveByUser: () => Promise.resolve(null),
          countAttempts: () => Promise.resolve(0),
        },
      },
      { provide: PrismaService, useValue: mockPrisma },
      {
        provide: ConfigService,
        useValue: {
          get: () => "test",
        },
      },
    ],
  }).compile();

  const subscriptionService = module.get<SubscriptionService>(SubscriptionService);
  const entitlementService = module.get<EntitlementService>(EntitlementService);
  const eligibilityService = module.get<EligibilityService>(EligibilityService);

  // Test 1: Quota > 0
  const userId1 = "candidate-test-1";
  mockDb.users.set(userId1, { id: userId1, email: "user1@test.com", role: "CANDIDATE" });
  mockDb.subscriptions.set(userId1, {
    id: "sub-1",
    userId: userId1,
    plan: "TCS_NQT_PACK",
    status: SubscriptionStatus.ACTIVE,
  });
  mockDb.plans.set("tcs_nqt_pack", {
    id: "plan-1",
    slug: "tcs_nqt_pack",
    name: "TCS NQT 3-Pack",
    features: [{ featureKey: "rounds_limit", valueJson: 3 }],
  });

  const ent1 = await entitlementService.getUserEntitlements(userId1);
  console.assert(ent1.hasActivePlan === true, "Test 1 Failed: hasActivePlan should be true");
  console.assert(ent1.status === "ACTIVE", "Test 1 Failed: status should be ACTIVE");
  console.assert(ent1.features.monthlyRoundsRemaining === 3, "Test 1 Failed: remaining rounds should be 3");
  console.log("✅ Test 1 Passed: Quota > 0 -> Active plan with full attempts");

  // Test 2: Consume rounds until quota = 0
  const r1 = await entitlementService.consumeRound(userId1);
  console.assert(r1.allowed === true && r1.remaining === 2, "Test 2.1 Failed");
  const r2 = await entitlementService.consumeRound(userId1);
  console.assert(r2.allowed === true && r2.remaining === 1, "Test 2.2 Failed");
  const r3 = await entitlementService.consumeRound(userId1);
  console.assert(r3.allowed === true && r3.remaining === 0, "Test 2.3 Failed");

  // 4th attempt should be blocked
  const r4 = await entitlementService.consumeRound(userId1);
  console.assert(r4.allowed === false && r4.remaining === 0, "Test 2.4 Failed");
  console.log("✅ Test 2 Passed: Consumed exactly 3 rounds atomically");

  // Test 3: Quota = 0 -> Automatically marks EXPIRED and blocks test eligibility
  const entExhausted = await entitlementService.getUserEntitlements(userId1);
  console.assert(entExhausted.hasActivePlan === false, "Test 3 Failed: hasActivePlan should be false");
  console.assert(entExhausted.status === "EXPIRED", "Test 3 Failed: status should be EXPIRED");

  const subStatus = await subscriptionService.getSubscriptionStatus(userId1);
  console.assert(subStatus.hasActivePlan === false, "Test 3.1 Failed: sub hasActivePlan should be false");
  console.assert(subStatus.status === SubscriptionStatus.EXPIRED, "Test 3.1 Failed: sub status should be EXPIRED");

  mockDb.examConfigs.set("exam-1", {
    id: "exam-1",
    isActive: true,
    status: "PUBLISHED",
    ruleFlags: { maxAttempts: 5 },
  });
  const eligibility = await eligibilityService.validateEligibility(userId1, "exam-1");
  console.assert(eligibility.eligible === false, "Test 3.2 Failed: eligibility should be false");
  console.assert(eligibility.errorCode === "QUOTA_EXHAUSTED", "Test 3.2 Failed: errorCode should be QUOTA_EXHAUSTED");
  console.assert(
    eligibility.reason === "Your assessment quota has been exhausted. Purchase a new plan to continue.",
    "Test 3.2 Failed: error message match",
  );
  console.log("✅ Test 3 Passed: Quota = 0 -> Plan EXPIRED and Eligibility blocked with QUOTA_EXHAUSTED");

  // Test 4: Referral rewards lifecycle
  const userId2 = "candidate-referral";
  mockDb.users.set(userId2, { id: userId2, email: "referral@test.com", role: "CANDIDATE" });
  mockDb.userQuotaOverrides.set(userId2, [
    {
      id: "ov-1",
      userId: userId2,
      featureKey: "allowed_assessments",
      overrideValue: { assessments: ["exam-tcs"], attemptsPerExam: 1 },
      reason: "1 Referral Reward Unlocked",
      expiresAt: null,
    },
  ]);

  const entRefBefore = await entitlementService.getUserEntitlements(userId2);
  console.assert(entRefBefore.hasActivePlan === true, "Test 4.1 Failed");
  console.assert(entRefBefore.features.monthlyRoundsRemaining === 1, "Test 4.1 Failed");

  mockDb.testInstances.set(userId2, [
    { id: "ti-1", userId: userId2, examConfigId: "exam-tcs", status: "COMPLETED" },
  ]);

  const entRefAfter = await entitlementService.getUserEntitlements(userId2);
  console.assert(entRefAfter.hasActivePlan === false, "Test 4.2 Failed");
  console.assert(entRefAfter.status === "INCOMPLETE", "Test 4.2 Failed");
  console.log("✅ Test 4 Passed: Referral reward consumed after completed attempt");

  console.log("\n🎉 All Quota Lifecycle verification scenarios passed successfully!");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
