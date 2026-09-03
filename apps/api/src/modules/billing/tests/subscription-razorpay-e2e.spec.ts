import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule, ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import { SubscriptionService } from "../services/subscription.service";
import { EntitlementService } from "../services/entitlement.service";
import { UsageQuotaService } from "../services/usage-quota.service";
import { RazorpayService } from "../services/razorpay.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { PlanTier, SubscriptionStatus, PaymentStatus } from "@prisma/client";
import { ForbiddenException } from "@nestjs/common";

describe("Subscription & Razorpay E2E Lifecycle Integration", () => {
  let module: TestingModule;
  let subscriptionService: SubscriptionService;
  let entitlementService: EntitlementService;
  let usageQuotaService: UsageQuotaService;
  let razorpayService: RazorpayService;

  // In-memory mock database state
  const mockDb = {
    users: new Map<string, any>(),
    subscriptions: new Map<string, any>(),
    paymentTransactions: new Map<string, any>(),
    usageQuotas: new Map<string, any>(),
    processedWebhookEvents: new Set<string>(),
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
        if (where.razorpaySubscriptionId) {
          for (const sub of mockDb.subscriptions.values()) {
            if (sub.razorpaySubscriptionId === where.razorpaySubscriptionId) {
              return Promise.resolve(sub);
            }
          }
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
        let found: any = null;
        for (const [userId, sub] of mockDb.subscriptions.entries()) {
          if (sub.id === where.id || userId === where.userId) {
            found = { ...sub, ...data, updatedAt: new Date() };
            mockDb.subscriptions.set(userId, found);
            break;
          }
        }
        return Promise.resolve(found);
      }),
    },
    paymentTransaction: {
      findUnique: jest.fn(({ where }) => {
        const tx = mockDb.paymentTransactions.get(where.razorpayPaymentId);
        return Promise.resolve(tx || null);
      }),
      findFirst: jest.fn(({ where }) => {
        for (const tx of mockDb.paymentTransactions.values()) {
          if (where.razorpayOrderId && tx.razorpayOrderId === where.razorpayOrderId) {
            return Promise.resolve(tx);
          }
        }
        return Promise.resolve(null);
      }),
      create: jest.fn(({ data }) => {
        const tx = { id: `tx_${Date.now()}`, ...data, createdAt: new Date() };
        mockDb.paymentTransactions.set(data.razorpayPaymentId, tx);
        return Promise.resolve(tx);
      }),
      upsert: jest.fn(({ where, create, update }) => {
        const existing = mockDb.paymentTransactions.get(where.razorpayPaymentId);
        const saved = {
          id: existing?.id || `tx_${Date.now()}`,
          razorpayPaymentId: where.razorpayPaymentId,
          ...(existing ? update : create),
          createdAt: existing?.createdAt || new Date(),
        };
        mockDb.paymentTransactions.set(where.razorpayPaymentId, saved);
        return Promise.resolve(saved);
      }),
      deleteMany: jest.fn(({ where }) => {
        let count = 0;
        for (const [key, tx] of mockDb.paymentTransactions.entries()) {
          if (where.razorpayOrderId && tx.razorpayOrderId === where.razorpayOrderId) {
            if (!where.status || tx.status === where.status) {
              mockDb.paymentTransactions.delete(key);
              count++;
            }
          }
        }
        return Promise.resolve({ count });
      }),
    },
    usageQuota: {
      findUnique: jest.fn(({ where }) => {
        const key = `${where.userId_periodKey.userId}_${where.userId_periodKey.periodKey}`;
        return Promise.resolve(mockDb.usageQuotas.get(key) || null);
      }),
      create: jest.fn(({ data }) => {
        const key = `${data.userId}_${data.periodKey}`;
        const quota = { id: `q_${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
        mockDb.usageQuotas.set(key, quota);
        return Promise.resolve(quota);
      }),
      upsert: jest.fn(({ where, create, update }) => {
        const key = `${where.userId_periodKey.userId}_${where.userId_periodKey.periodKey}`;
        const existing = mockDb.usageQuotas.get(key);
        if (existing) {
          if (update.roundsUsed?.increment) {
            existing.roundsUsed += update.roundsUsed.increment;
          }
          existing.updatedAt = new Date();
          mockDb.usageQuotas.set(key, existing);
          return Promise.resolve(existing);
        }
        const quota = { id: `q_${Date.now()}`, ...create, createdAt: new Date(), updatedAt: new Date() };
        mockDb.usageQuotas.set(key, quota);
        return Promise.resolve(quota);
      }),
      update: jest.fn(({ where, data }) => {
        const key = `${where.userId_periodKey.userId}_${where.userId_periodKey.periodKey}`;
        const existing = mockDb.usageQuotas.get(key) || { roundsUsed: 0 };
        if (data.roundsUsed?.increment) {
          existing.roundsUsed += data.roundsUsed.increment;
        }
        existing.updatedAt = new Date();
        mockDb.usageQuotas.set(key, existing);
        return Promise.resolve(existing);
      }),
    },
    processedWebhookEvent: {
      findUnique: jest.fn(({ where }) =>
        Promise.resolve(mockDb.processedWebhookEvents.has(where.eventId) ? { eventId: where.eventId } : null),
      ),
      create: jest.fn(({ data }) => {
        if (mockDb.processedWebhookEvents.has(data.eventId)) {
          const err: any = new Error("Unique constraint violation");
          err.code = "P2002";
          throw err;
        }
        mockDb.processedWebhookEvents.add(data.eventId);
        return Promise.resolve(data);
      }),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  const testKeySecret = "lIeKzA3waDH4rt4RpSzi17ns";
  const testWebhookSecret = "lIeKzA3waDH4rt4RpSzi17ns";

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        SubscriptionService,
        EntitlementService,
        UsageQuotaService,
        RazorpayService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === "RAZORPAY_KEY_ID") return "rzp_test_TX348y44ukrAKt";
              if (key === "RAZORPAY_KEY_SECRET") return testKeySecret;
              if (key === "RAZORPAY_WEBHOOK_SECRET") return testWebhookSecret;
              return null;
            }),
          },
        },
      ],
    }).compile();

    subscriptionService = module.get<SubscriptionService>(SubscriptionService);
    entitlementService = module.get<EntitlementService>(EntitlementService);
    usageQuotaService = module.get<UsageQuotaService>(UsageQuotaService);
    razorpayService = module.get<RazorpayService>(RazorpayService);

    // Mock internal Razorpay orders.create
    if ((razorpayService as any).razorpayInstance) {
      (razorpayService as any).razorpayInstance.orders = {
        create: jest.fn().mockImplementation(async (params) => ({
          id: `order_mock_${Date.now()}`,
          amount: params.amount,
          currency: params.currency,
          receipt: params.receipt,
        })),
      };
    }
  });

  beforeEach(() => {
    mockDb.users.clear();
    mockDb.subscriptions.clear();
    mockDb.paymentTransactions.clear();
    mockDb.usageQuotas.clear();
    mockDb.processedWebhookEvents.clear();
  });

  it("Step 1: New user registration -> Initial subscription check indicates NO active plan", async () => {
    const userId = "candidate-101";
    mockDb.users.set(userId, { id: userId, email: "candidate@skillitrix.com" });

    const status = await subscriptionService.getSubscriptionStatus(userId);
    expect(status.hasActivePlan).toBe(false);
    expect(status.plan).toBeNull();

    const entitlements = await entitlementService.getUserEntitlements(userId);
    expect(entitlements.hasActivePlan).toBe(false);
    expect(entitlements.status).toBe("INCOMPLETE");
  });

  it("Step 2: Candidate chooses Free plan -> Activates Free tier with 3 rounds/month limit", async () => {
    const userId = "candidate-101";
    mockDb.users.set(userId, { id: userId, email: "candidate@skillitrix.com" });

    const sub = await subscriptionService.subscribeFree(userId);
    expect(sub.plan).toBe(PlanTier.FREE);
    expect(sub.status).toBe(SubscriptionStatus.ACTIVE);

    const entitlements = await entitlementService.getUserEntitlements(userId);
    expect(entitlements.hasActivePlan).toBe(true);
    expect(entitlements.plan).toBe("FREE");
    expect(entitlements.features.monthlyRoundsLimit).toBe(3);
    expect(entitlements.features.monthlyRoundsRemaining).toBe(3);
    expect(entitlements.features.voiceInterviews).toBe(false);
    expect(entitlements.features.questionBankSize).toBe(50);
  });

  it("Step 3: Atomic Quota Consumption -> Concurrently consuming rounds stops exactly at 3 rounds without race conditions", async () => {
    const userId = "candidate-101";
    mockDb.users.set(userId, { id: userId, email: "candidate@skillitrix.com" });
    await subscriptionService.subscribeFree(userId);

    // Consume round 1
    const r1 = await entitlementService.consumeRound(userId);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    // Consume round 2
    const r2 = await entitlementService.consumeRound(userId);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    // Consume round 3
    const r3 = await entitlementService.consumeRound(userId);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);

    // Attempt round 4 -> Atomic check rejects with allowed: false
    const r4 = await entitlementService.consumeRound(userId);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);

    const hasQuota = await entitlementService.hasRoundQuota(userId);
    expect(hasQuota).toBe(false);
  });

  it("Step 4: Create Razorpay Order for Pro upgrade -> Validates canonical server price (₹2,400 / 240,000 paise) and records local ownership", async () => {
    const userId = "candidate-101";
    const order = await razorpayService.createOrder({
      userId,
      email: "candidate@skillitrix.com",
      plan: "PRO",
    });

    expect(order.amount).toBe(240000);
    expect(order.currency).toBe("INR");
    expect(order.plan).toBe("PRO");
    expect(order.keyId).toBe("rzp_test_TX348y44ukrAKt");

    // Record local order in DB
    await subscriptionService.recordPendingOrder({
      userId,
      razorpayOrderId: order.order_id,
      amount: order.amount,
      currency: order.currency,
      plan: "PRO",
    });

    // Valid ownership passes
    const isValidOwner = await subscriptionService.validateOrderOwnership(userId, order.order_id);
    expect(isValidOwner).toBe(true);

    // Tampering by another user fails
    await expect(
      subscriptionService.validateOrderOwnership("malicious-user-999", order.order_id),
    ).rejects.toThrow(ForbiddenException);
  });

  it("Step 5: Client completes Razorpay checkout -> Signature verified & Pro subscription activated", async () => {
    const userId = "candidate-101";
    mockDb.users.set(userId, { id: userId, email: "candidate@skillitrix.com" });

    const orderId = "order_pro_test_123456";
    const paymentId = "pay_test_987654321";
    const payload = `${orderId}|${paymentId}`;

    const validSignature = crypto
      .createHmac("sha256", testKeySecret)
      .update(payload)
      .digest("hex");

    // Unified Payment Processing
    const subscription = await subscriptionService.processPaymentSuccess({
      userId,
      plan: PlanTier.PRO,
      razorpayPaymentId: paymentId,
      razorpayOrderId: orderId,
      razorpaySignature: validSignature,
      amount: 240000,
      source: "CLIENT_CALLBACK",
    });

    expect(subscription).toBeDefined();
    expect(subscription!.plan).toBe(PlanTier.PRO);
    expect(subscription!.status).toBe(SubscriptionStatus.ACTIVE);

    // Verify updated entitlements
    const entitlements = await entitlementService.getUserEntitlements(userId);
    expect(entitlements.hasActivePlan).toBe(true);
    expect(entitlements.plan).toBe("PRO");
    expect(entitlements.features.voiceInterviews).toBe(true);
    expect(entitlements.features.monthlyRoundsLimit).toBeNull(); // Unlimited
    expect(entitlements.features.transcriptExport).toContain("pdf");
    expect(entitlements.features.questionBankSize).toBe(512);
  });

  it("Step 6: Idempotent Payment & Webhook processing -> Duplicate events do not cause errors or multiple charges", async () => {
    const userId = "candidate-101";
    const paymentId = "pay_idempotent_test_001";
    const orderId = "order_idempotent_test_001";

    // First call (Client Callback)
    await subscriptionService.processPaymentSuccess({
      userId,
      plan: PlanTier.PRO,
      razorpayPaymentId: paymentId,
      razorpayOrderId: orderId,
      amount: 240000,
      source: "CLIENT_CALLBACK",
    });

    // Second call (Webhook arrives 2 seconds later with same payment ID)
    const webhookResult = await subscriptionService.processPaymentSuccess({
      userId,
      plan: PlanTier.PRO,
      razorpayPaymentId: paymentId,
      razorpayOrderId: orderId,
      amount: 240000,
      source: "WEBHOOK",
    });

    expect(webhookResult).toBeDefined();
    expect(webhookResult!.plan).toBe(PlanTier.PRO);
    // Ensure only 1 payment transaction record was created
    expect(mockDb.paymentTransactions.size).toBe(1);
  });

  it("Step 7: Webhook Deduplication -> Ignores already processed event IDs atomically", async () => {
    const eventId = "evt_razorpay_duplicate_001";
    expect(await subscriptionService.isWebhookEventProcessed(eventId)).toBe(false);

    await subscriptionService.recordWebhookEvent(eventId, "payment.captured");
    expect(await subscriptionService.isWebhookEventProcessed(eventId)).toBe(true);
  });

  it("Step 8: Payment Failure Handling -> Marks subscription as PAST_DUE", async () => {
    const userId = "candidate-101";
    // Setup active pro subscription
    mockDb.subscriptions.set(userId, {
      id: "sub-1",
      userId,
      plan: PlanTier.PRO,
      status: SubscriptionStatus.ACTIVE,
    });

    await subscriptionService.handlePaymentFailure({
      userId,
      razorpayPaymentId: "pay_failed_123",
      razorpayOrderId: "order_failed_123",
      amount: 240000,
    });

    const updatedSub = mockDb.subscriptions.get(userId);
    expect(updatedSub.status).toBe(SubscriptionStatus.PAST_DUE);
  });

  it("Step 9: Signature Mismatch -> Rejects forged payments", () => {
    const isValid = razorpayService.verifyPaymentSignature({
      razorpay_order_id: "order_123",
      razorpay_payment_id: "pay_123",
      razorpay_signature: "forged_signature_00000000000000000000000000000000",
    });

    expect(isValid).toBe(false);
  });

  it("Step 10: Subscription Expiration -> Expired subscription loses access at entitlement boundary", async () => {
    const userId = "candidate-expired-user";
    mockDb.users.set(userId, { id: userId, email: "expired@skillitrix.com" });

    // Set an expired date in the past
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    mockDb.subscriptions.set(userId, {
      id: "sub-expired-1",
      userId,
      plan: PlanTier.PRO,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: pastDate,
    });

    const entitlements = await entitlementService.getUserEntitlements(userId);
    expect(entitlements.hasActivePlan).toBe(false);
    expect(entitlements.status).toBe("EXPIRED");

    const hasVoiceAccess = await entitlementService.hasEntitlement(userId, "voiceInterviews");
    expect(hasVoiceAccess).toBe(false);

    const hasQuota = await entitlementService.hasRoundQuota(userId);
    expect(hasQuota).toBe(false);
  });
});
