import { Injectable, Logger, ConflictException, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { PlanTier, SubscriptionStatus, PaymentStatus } from "@prisma/client";
import { SubscriptionStatusResponse } from "@intervu-ai/contracts";
import { PlanManagementService } from "./plan-management.service";

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly planManagementService: PlanManagementService,
  ) {}

  async getUserSubscription(userId: string) {
    return this.prisma.subscription.findUnique({
      where: { userId },
      include: {
        usageQuotas: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
  }

  private async isVipUser(userId: string): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, role: true },
      });
      if (!user) return false;
      const email = user.email?.toLowerCase().trim();
      return email === "candidate@intervu.ai" || email === "admin@intervu.ai";
    } catch {
      return false;
    }
  }

  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatusResponse> {
    if (await this.isVipUser(userId)) {
      return {
        hasActivePlan: true,
        plan: "VIP_UNLIMITED" as any,
        planName: "VIP Tester (All Access)",
        planSlug: "vip-unlimited",
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: "2099-12-31T23:59:59.999Z",
        cancelAtPeriodEnd: false,
      };
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    const now = new Date();

    // Check active user quota overrides (e.g. referral rewards)
    let hasRemainingReferralReward = false;
    let referralRewardReason = '';
    let remainingAttemptsCount = 0;
    let latestOverrideExpiry: Date | null = null;
    let totalRemainingAttempts = 0;
    const reasons: string[] = [];

    try {
      const activeOverrides = await this.prisma.userQuotaOverride.findMany({
        where: {
          userId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } },
          ],
        },
      });

      for (const override of activeOverrides) {
        if (override.expiresAt && (!latestOverrideExpiry || override.expiresAt > latestOverrideExpiry)) {
          latestOverrideExpiry = override.expiresAt;
        }

        if (override.featureKey === 'allowed_assessments' || override.featureKey === 'allowedAssessments') {
          const val = override.overrideValue as any;
          const maxAttempts = typeof val?.attemptsPerExam === 'number' ? val.attemptsPerExam : 1;
          const targetAssessments = Array.isArray(val?.assessments) ? val.assessments : [];

          let completedAttempts = 0;
          if (targetAssessments.length > 0) {
            completedAttempts = await this.prisma.testInstance.count({
              where: {
                userId,
                status: { in: ['SUBMITTED', 'COMPLETED'] },
                OR: [
                  { examConfigId: { in: targetAssessments } },
                  { testConfigId: { in: targetAssessments } },
                  { examConfig: { code: { in: targetAssessments } } },
                  { examConfig: { name: { in: targetAssessments } } },
                ],
              },
            });
          } else {
            completedAttempts = await this.prisma.testInstance.count({
              where: {
                userId,
                status: { in: ['SUBMITTED', 'COMPLETED'] },
              },
            });
          }

          if (completedAttempts < maxAttempts) {
            hasRemainingReferralReward = true;
            totalRemainingAttempts += (maxAttempts - completedAttempts);
            if (override.reason) reasons.push(override.reason);
          }
        } else if (override.featureKey === 'monthly_rounds_limit' || override.featureKey === 'monthlyRoundsLimit') {
          // If this bonus round is auxiliary to an allowed_assessments reward, the assessment attempt limit above governs
          const hasAllowedAssessments = activeOverrides.some(
            (o) => o.featureKey === 'allowed_assessments' || o.featureKey === 'allowedAssessments',
          );
          if (
            hasAllowedAssessments &&
            (override.reason?.includes('Bonus Round') ||
             override.reason?.includes('Bonus Practice Round') ||
             override.reason?.includes('Referral') ||
             override.reason?.includes('reward') ||
             override.reason?.includes('Assigned Access'))
          ) {
            continue;
          }

          const val = override.overrideValue as any;
          const bonus = typeof val?.bonusRounds === 'number' ? val.bonusRounds : (typeof val === 'number' ? val : 0);
          let used = 0;
          const periodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          const q = await this.prisma.usageQuota.findFirst({
            where: {
              userId,
              OR: [
                { periodKey },
                { subscriptionId: subscription?.id },
              ],
            },
          });
          used = q?.roundsUsed || 0;
          const instanceCount = await this.prisma.testInstance.count({
            where: {
              userId,
              status: { in: ['SUBMITTED', 'COMPLETED'] },
            },
          });
          used = Math.max(used, instanceCount);

          if (bonus > used) {
            hasRemainingReferralReward = true;
            totalRemainingAttempts += (bonus - used);
            if (override.reason) reasons.push(override.reason);
          }
        }
      }

      remainingAttemptsCount = totalRemainingAttempts;
      if (reasons.length > 0) {
        referralRewardReason =
          reasons.length === 1
            ? reasons[0]
            : `${reasons.length} Referral Rewards Active`;
      }
    } catch (err) {
      this.logger.warn(`Error checking referral overrides for ${userId}: ${err}`);
    }

    if (!subscription) {
      if (hasRemainingReferralReward) {
        return {
          hasActivePlan: true,
          plan: 'REFERRAL_PASS' as any,
          planName: referralRewardReason || 'Referral Access Pass',
          planSlug: 'referral-pass',
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: latestOverrideExpiry ? latestOverrideExpiry.toISOString() : null,
          cancelAtPeriodEnd: false,
        };
      }
      return {
        hasActivePlan: false,
        plan: null,
        status: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      };
    }

    const isPaid = subscription.plan !== PlanTier.FREE;
    const isExpired =
      isPaid &&
      subscription.currentPeriodEnd &&
      subscription.currentPeriodEnd < now;

    // For paid subscribers: active if status is ACTIVE and period not expired.
    // For FREE plan tier: active only while referral reward quota is remaining.
    const isActive = isPaid
      ? subscription.status === SubscriptionStatus.ACTIVE && !isExpired
      : hasRemainingReferralReward;

    // Resolve dynamic plan details from database
    let planSlug = String(subscription.plan).toLowerCase();
    let planDisplayName = `${subscription.plan} Plan`;

    try {
      let dbPlan = await this.prisma.plan.findFirst({
        where: {
          OR: [
            { slug: planSlug },
            { id: String(subscription.razorpayPlanId || "") },
          ],
        },
      });

      if (!dbPlan) {
        const latestPayment = await this.prisma.paymentTransaction.findFirst({
          where: { userId, status: "SUCCESS" },
          orderBy: { createdAt: "desc" },
        });
        const paymentPlanVal = (latestPayment?.eventPayload as any)?.plan;
        if (paymentPlanVal) {
          const pStr = String(paymentPlanVal).toLowerCase();
          dbPlan = await this.prisma.plan.findFirst({
            where: {
              OR: [
                { slug: pStr },
                { id: pStr },
                { name: { equals: paymentPlanVal, mode: "insensitive" } },
              ],
            },
          });
        }
      }

      if (!dbPlan && isPaid) {
        const activePlans = await this.prisma.plan.findMany({
          where: { isActive: true },
        });
        if (activePlans.length === 1) {
          dbPlan = activePlans[0];
        }
      }

      if (dbPlan && isPaid) {
        planSlug = dbPlan.slug;
        planDisplayName = dbPlan.name;
      } else if (!isPaid) {
        if (hasRemainingReferralReward) {
          planSlug = 'referral-pass';
          planDisplayName = referralRewardReason || 'Referral Access Pass';
        } else {
          planSlug = 'free';
          planDisplayName = 'Free Tier (No Active Plan)';
        }
      }
    } catch {}

    const effectiveStatus = isExpired
      ? ("EXPIRED" as any)
      : isPaid
        ? (subscription.status as any)
        : hasRemainingReferralReward
          ? SubscriptionStatus.ACTIVE
          : SubscriptionStatus.INCOMPLETE;

    return {
      hasActivePlan: isActive,
      plan: planSlug.toUpperCase() as any,
      planName: planDisplayName,
      planSlug: planSlug,
      status: effectiveStatus,
      currentPeriodEnd: latestOverrideExpiry
        ? latestOverrideExpiry.toISOString()
        : subscription.currentPeriodEnd
          ? subscription.currentPeriodEnd.toISOString()
          : null,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
  }

  async subscribeFree(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const existing = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (existing && existing.status === SubscriptionStatus.ACTIVE && existing.plan !== PlanTier.FREE) {
      throw new ConflictException("User already has an active paid subscription");
    }

    const subscription = await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: PlanTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        billingCycle: "monthly",
        currentPeriodStart: new Date(),
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      },
      update: {
        plan: PlanTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(),
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      },
    });

    this.logger.log(`Free subscription activated for user ${userId}`);
    return subscription;
  }

  /**
   * Persists pending order for local ownership verification
   */
  async recordPendingOrder(params: {
    userId: string;
    razorpayOrderId: string;
    amount: number;
    currency: string;
    plan: PlanTier;
  }) {
    // Intentionally not caught: if this write fails, create-order must fail too -
    // otherwise the client proceeds to charge the user for an order verify-payment
    // can never find (getOrderPlan returns null), leaving them paid with no subscription.
    await this.prisma.paymentTransaction.upsert({
      where: { razorpayPaymentId: `pending_${params.razorpayOrderId}` },
      create: {
        userId: params.userId,
        razorpayOrderId: params.razorpayOrderId,
        razorpayPaymentId: `pending_${params.razorpayOrderId}`,
        amount: params.amount,
        currency: params.currency,
        status: PaymentStatus.PENDING,
        eventPayload: { plan: params.plan, initiatedAt: new Date() },
      },
      update: {
        amount: params.amount,
        currency: params.currency,
        eventPayload: { plan: params.plan, updatedAt: new Date() },
      },
    });
  }

  /**
   * Validates local order ownership in database
   */
  async validateOrderOwnership(userId: string, razorpayOrderId: string): Promise<boolean> {
    const tx = await this.prisma.paymentTransaction.findFirst({
      where: { razorpayOrderId },
    });

    if (tx && tx.userId !== userId) {
      this.logger.warn(`SEC: User ${userId} attempted to verify order ${razorpayOrderId} owned by ${tx.userId}`);
      throw new ForbiddenException("Payment order does not belong to the authenticated user");
    }

    return true;
  }

  /**
   * Resolves the authoritative plan & price that were recorded server-side when the
   * order was created (recordPendingOrder). This is the only trustworthy source for
   * what a client should be granted after payment - a client-supplied plan/amount on
   * the verify-payment call must never be used to decide entitlements.
   */
  async getOrderPlan(
    razorpayOrderId: string,
  ): Promise<{ plan: PlanTier; amount: number; currency: string } | null> {
    const tx = await this.prisma.paymentTransaction.findFirst({
      where: { razorpayOrderId },
      orderBy: { createdAt: "desc" },
    });

    if (!tx) {
      return null;
    }

    const payloadPlan = (tx.eventPayload as any)?.plan;
    const plan = (String(payloadPlan || "PRO").toUpperCase() as PlanTier);

    return { plan, amount: tx.amount, currency: tx.currency };
  }

  /**
   * Unified, Idempotent Payment Processor
   * Used identically by both Client Checkout Callback & Webhook with Atomic Webhook Event Recording
   */
  async processPaymentSuccess(params: {
    userId: string;
    plan: PlanTier;
    razorpayPaymentId: string;
    razorpayOrderId?: string;
    razorpaySignature?: string;
    razorpayCustomerId?: string;
    amount: number;
    currency?: string;
    currentPeriodEnd?: Date;
    eventPayload?: any;
    source: "CLIENT_CALLBACK" | "WEBHOOK" | "ADMIN_MANUAL_VERIFICATION";
    webhookEventId?: string;
    webhookEventType?: string;
  }) {
    const {
      userId,
      plan,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      razorpayCustomerId,
      amount,
      currency = "INR",
      currentPeriodEnd,
      eventPayload,
      source,
      webhookEventId,
      webhookEventType,
    } = params;

    const periodEnd =
      currentPeriodEnd ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days period

    // 1. Check if transaction with this payment ID is already recorded
    const existingTx = await this.prisma.paymentTransaction.findUnique({
      where: { razorpayPaymentId },
    });

    if (existingTx) {
      this.logger.log(
        `[IDEMPOTENT] Payment ${razorpayPaymentId} already processed. Returning active subscription.`,
      );
      return this.prisma.subscription.findUnique({ where: { userId } });
    }

    // 2. Perform atomic activation, webhook deduplication & transaction logging in a single DB commit
    return this.prisma.$transaction(async (tx) => {
      if (webhookEventId) {
        try {
          await tx.processedWebhookEvent.create({
            data: {
              eventId: webhookEventId,
              eventType: webhookEventType || "unknown",
            },
          });
        } catch (err: any) {
          if (err?.code === "P2002") {
            this.logger.log(
              `[ATOMIC WEBHOOK DEDUP] Event ${webhookEventId} already recorded. Aborting concurrent duplicate.`,
            );
            return tx.subscription.findUnique({ where: { userId } });
          }
          throw err;
        }
      }

      const subscription = await tx.subscription.upsert({
        where: { userId },
        create: {
          userId,
          plan,
          status: SubscriptionStatus.ACTIVE,
          billingCycle: "monthly",
          razorpaySubscriptionId: razorpayOrderId,
          razorpayCustomerId,
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        },
        update: {
          plan,
          status: SubscriptionStatus.ACTIVE,
          razorpaySubscriptionId: razorpayOrderId || undefined,
          razorpayCustomerId: razorpayCustomerId || undefined,
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        },
      });

      // Clean up any temporary pending order record for this razorpayOrderId to avoid duplicate entries
      if (razorpayOrderId && tx.paymentTransaction?.deleteMany) {
        await tx.paymentTransaction.deleteMany({
          where: {
            razorpayOrderId,
            status: PaymentStatus.PENDING,
          },
        });
      }

      await tx.paymentTransaction.create({
        data: {
          userId,
          subscriptionId: subscription.id,
          razorpayPaymentId,
          razorpayOrderId,
          razorpaySignature,
          amount,
          currency,
          status: PaymentStatus.SUCCESS,
          eventPayload: { source, ...eventPayload },
        },
      });

      this.logger.log(
        `[Payment Success] User ${userId} upgraded to ${plan} via ${source} (Pay ID: ${razorpayPaymentId})`,
      );

      return subscription;
    });
  }

  async handlePaymentFailure(params: {
    userId: string;
    razorpayPaymentId: string;
    razorpayOrderId?: string;
    amount?: number;
    eventPayload?: any;
  }) {
    const { userId, razorpayPaymentId, razorpayOrderId, amount = 0, eventPayload } = params;

    const existingTx = await this.prisma.paymentTransaction.findUnique({
      where: { razorpayPaymentId },
    });

    if (!existingTx) {
      await this.prisma.paymentTransaction.create({
        data: {
          userId,
          razorpayPaymentId,
          razorpayOrderId,
          amount,
          status: PaymentStatus.FAILED,
          eventPayload,
        },
      });
    }

    // Mark subscription PAST_DUE if user had an active paid plan
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (sub && sub.plan !== PlanTier.FREE) {
      await this.prisma.subscription.update({
        where: { userId },
        data: { status: SubscriptionStatus.PAST_DUE },
      });
      this.logger.warn(`Subscription for user ${userId} marked as PAST_DUE due to payment failure`);
    }
  }

  async isWebhookEventProcessed(eventId: string): Promise<boolean> {
    const existing = await this.prisma.processedWebhookEvent.findUnique({
      where: { eventId },
    });
    return Boolean(existing);
  }

  async recordWebhookEvent(eventId: string, eventType: string): Promise<void> {
    try {
      await this.prisma.processedWebhookEvent.create({
        data: {
          eventId,
          eventType,
        },
      });
    } catch {
      // Ignore conflict if duplicate
    }
  }

  async activatePaidSubscription(params: {
    userId: string;
    plan: PlanTier;
    razorpaySubscriptionId?: string;
    razorpayCustomerId?: string;
    currentPeriodEnd?: Date;
    billingCycle?: string;
  }) {
    const amount = await this.resolvePlanAmount(params.plan);
    return this.processPaymentSuccess({
      userId: params.userId,
      plan: params.plan,
      razorpayPaymentId: `manual_${Date.now()}_${params.userId.slice(-4)}`,
      razorpayOrderId: params.razorpaySubscriptionId,
      razorpayCustomerId: params.razorpayCustomerId,
      currentPeriodEnd: params.currentPeriodEnd,
      amount,
      source: "CLIENT_CALLBACK",
    });
  }

  /**
   * Looks up the admin-configured price for a plan tier from the database.
   * Falls back to 0 (rather than a guessed number) if no matching Plan row exists,
   * so bookkeeping never silently records a fabricated price.
   */
  private async resolvePlanAmount(plan: PlanTier): Promise<number> {
    try {
      const dbPlan = await this.planManagementService.getPlanBySlug(String(plan).toLowerCase());
      return typeof dbPlan?.priceMonthly === "number" ? dbPlan.priceMonthly : 0;
    } catch {
      return 0;
    }
  }

  async cancelSubscriptionByRazorpayId(razorpaySubscriptionId: string) {
    const existing = await this.prisma.subscription.findUnique({
      where: { razorpaySubscriptionId },
    });

    if (!existing) {
      this.logger.warn(`Subscription with razorpay ID ${razorpaySubscriptionId} not found`);
      return null;
    }

    return this.prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status: SubscriptionStatus.CANCELED,
        cancelAtPeriodEnd: true,
      },
    });
  }
}
