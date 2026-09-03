import { Injectable, Logger } from "@nestjs/common";
import {
  UserEntitlements,
  PLAN_ENTITLEMENT_DEFINITIONS,
  PlanTier,
  SubscriptionStatus,
  PlanFeatures,
} from "@intervu-ai/contracts";
import { SubscriptionService } from "./subscription.service";
import { UsageQuotaService } from "./usage-quota.service";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class EntitlementService {
  private readonly logger = new Logger(EntitlementService.name);

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly usageQuotaService: UsageQuotaService,
    private readonly prisma: PrismaService,
  ) {}

  async getUserEntitlements(userId: string): Promise<UserEntitlements> {
    const subscription = await this.subscriptionService.getUserSubscription(userId);

    // Default Fallback when no subscription exists
    if (!subscription) {
      const freeDef = PLAN_ENTITLEMENT_DEFINITIONS.FREE;
      return {
        plan: "FREE",
        status: "INCOMPLETE",
        hasActivePlan: false,
        currentPeriodEnd: null,
        features: {
          ...freeDef,
          monthlyRoundsLimit: 0,
          monthlyRoundsUsed: 0,
          monthlyRoundsRemaining: 0,
        },
      };
    }

    const now = new Date();
    const isExpired =
      subscription.plan !== "FREE" &&
      subscription.currentPeriodEnd &&
      subscription.currentPeriodEnd < now;

    const effectiveStatus: SubscriptionStatus = isExpired
      ? "EXPIRED"
      : (subscription.status as SubscriptionStatus);

    const hasActivePlan = effectiveStatus === "ACTIVE" && !isExpired;
    const planTier: PlanTier = (subscription.plan as PlanTier) || "FREE";

    // 1. Try to fetch dynamic plan and features from Database
    let planDef: PlanFeatures = { ...PLAN_ENTITLEMENT_DEFINITIONS.FREE };
    let dbPlan: any = null;

    try {
      dbPlan = await this.prisma.plan.findFirst({
        where: {
          OR: [
            { slug: String(planTier).toLowerCase() },
            { id: String(subscription.razorpayPlanId || "") },
          ],
        },
        include: { features: true },
      });

      // If not found directly by planTier slug, check user's latest successful payment record
      if (!dbPlan) {
        const latestPayment = await this.prisma.paymentTransaction.findFirst({
          where: { userId, status: "SUCCESS" },
          orderBy: { createdAt: "desc" },
        });

        const paymentPlanVal = (latestPayment?.eventPayload as any)?.plan;
        if (paymentPlanVal) {
          const planStr = String(paymentPlanVal).toLowerCase();
          dbPlan = await this.prisma.plan.findFirst({
            where: {
              OR: [
                { slug: planStr },
                { id: planStr },
                { name: { equals: paymentPlanVal, mode: "insensitive" } },
              ],
            },
            include: { features: true },
          });
        }
      }

      // If still not found, check if there is an active dynamic plan configured in DB
      if (!dbPlan) {
        const activePlans = await this.prisma.plan.findMany({
          where: { isActive: true },
          include: { features: true },
        });
        if (activePlans.length === 1) {
          dbPlan = activePlans[0];
        }
      }

      if (dbPlan && dbPlan.features.length > 0) {
        // Map database features to PlanFeatures object
        const dynamicFeats: Record<string, any> = {};
        for (const f of dbPlan.features) {
          // normalize snake_case keys (e.g. monthly_rounds_limit -> monthlyRoundsLimit)
          const camelKey = f.featureKey.replace(/_([a-z])/g, (_: string, g: string) => g.toUpperCase());
          dynamicFeats[camelKey] = f.valueJson;
          dynamicFeats[f.featureKey] = f.valueJson;
        }

        planDef = {
          ...PLAN_ENTITLEMENT_DEFINITIONS.FREE,
          ...dynamicFeats,
          monthlyRoundsLimit:
            dynamicFeats.monthlyRoundsLimit !== undefined
              ? dynamicFeats.monthlyRoundsLimit
              : (PLAN_ENTITLEMENT_DEFINITIONS[String(planTier)]?.monthlyRoundsLimit ?? 3),
          roundFormats: dynamicFeats.allowedFormats || dynamicFeats.roundFormats || ['all'],
        };
      } else if (PLAN_ENTITLEMENT_DEFINITIONS[String(planTier)]) {
        planDef = { ...PLAN_ENTITLEMENT_DEFINITIONS[String(planTier)] };
      }
    } catch (err) {
      this.logger.warn(`Failed to fetch dynamic plan from DB for '${planTier}', using fallback definitions: ${err}`);
      if (PLAN_ENTITLEMENT_DEFINITIONS[String(planTier)]) {
        planDef = { ...PLAN_ENTITLEMENT_DEFINITIONS[String(planTier)] };
      }
    }

    // 2. Check for active user quota overrides (Admin / Plan Manager grants)
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
        if (override.featureKey === 'monthly_rounds_limit' || override.featureKey === 'monthlyRoundsLimit') {
          const val = override.overrideValue as any;
          if (val?.unlimited) {
            planDef.monthlyRoundsLimit = null;
          } else if (typeof val?.bonusRounds === 'number') {
            const base = typeof planDef.monthlyRoundsLimit === 'number' ? planDef.monthlyRoundsLimit : 0;
            planDef.monthlyRoundsLimit = base + val.bonusRounds;
          } else if (typeof val === 'number') {
            planDef.monthlyRoundsLimit = val;
          }
        } else {
          const camelKey = override.featureKey.replace(/_([a-z])/g, (_: string, g: string) => g.toUpperCase());
          (planDef as any)[camelKey] = override.overrideValue;
          (planDef as any)[override.featureKey] = override.overrideValue;
        }
      }
    } catch (err) {
      this.logger.warn(`Failed to fetch user quota overrides for '${userId}': ${err}`);
    }

    // 3. Load monthly quota consumption
    const quota = await this.usageQuotaService.getOrCreateCurrentQuota(
      userId,
      subscription.id,
    );

    const roundsUsed = quota?.roundsUsed || 0;
    const roundsRemaining =
      planDef.monthlyRoundsLimit === null
        ? null
        : Math.max(0, planDef.monthlyRoundsLimit - roundsUsed);

    const planDisplayName = dbPlan?.name || (planTier !== "FREE" ? `${planTier} Plan` : "Free Plan");
    const planSlugName = dbPlan?.slug || String(planTier).toLowerCase();

    return {
      plan: planTier,
      planName: planDisplayName,
      planSlug: planSlugName,
      status: effectiveStatus,
      hasActivePlan,
      currentPeriodEnd: subscription.currentPeriodEnd
        ? subscription.currentPeriodEnd.toISOString()
        : null,
      features: {
        ...planDef,
        monthlyRoundsUsed: roundsUsed,
        monthlyRoundsRemaining: roundsRemaining,
      },
    };
  }

  async hasEntitlement(
    userId: string,
    feature: string,
    requiredValue?: any,
  ): Promise<boolean> {
    const entitlements = await this.getUserEntitlements(userId);
    if (!entitlements.hasActivePlan) {
      return false;
    }

    const featureVal = entitlements.features[feature];
    if (typeof featureVal === "boolean") {
      return featureVal;
    }
    if (Array.isArray(featureVal)) {
      if (!requiredValue) return featureVal.length > 0;
      return featureVal.includes("all") || featureVal.includes(requiredValue);
    }
    if (typeof featureVal === "string" && requiredValue) {
      return featureVal === requiredValue;
    }
    return Boolean(featureVal);
  }

  async hasRoundQuota(userId: string): Promise<boolean> {
    const entitlements = await this.getUserEntitlements(userId);
    if (!entitlements.hasActivePlan) {
      return false;
    }

    if (entitlements.features.monthlyRoundsLimit === null) {
      return true; // Unlimited
    }

    return (entitlements.features.monthlyRoundsRemaining ?? 0) > 0;
  }

  /**
   * Atomically reserves/consumes 1 assessment round.
   * Concurrency-safe against race conditions.
   */
  async consumeRound(userId: string): Promise<{ allowed: boolean; remaining: number | null }> {
    const entitlements = await this.getUserEntitlements(userId);
    if (!entitlements.hasActivePlan) {
      return { allowed: false, remaining: 0 };
    }

    const limit = entitlements.features.monthlyRoundsLimit;
    const result = await this.usageQuotaService.consumeRoundQuota(userId, limit);
    return { allowed: result.allowed, remaining: result.remaining };
  }
}
