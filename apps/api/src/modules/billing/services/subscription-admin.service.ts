import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { PlanTier, SubscriptionStatus } from "@prisma/client";

@Injectable()
export class SubscriptionAdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Search and list candidate subscriptions with usage and active overrides
   */
  async getCandidateSubscriptions(params: {
    page?: number;
    limit?: number;
    search?: string;
    plan?: string;
    status?: SubscriptionStatus;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const userWhere: any = {
      role: "CANDIDATE",
    };

    if (params.search) {
      userWhere.OR = [
        { email: { contains: params.search, mode: "insensitive" } },
        { fullName: { contains: params.search, mode: "insensitive" } },
      ];
    }

    if (params.plan || params.status) {
      userWhere.subscription = {};
      if (params.plan) {
        userWhere.subscription.plan = params.plan.toUpperCase();
      }
      if (params.status) {
        userWhere.subscription.status = params.status;
      }
    }

    const currentPeriodKey = new Date().toISOString().slice(0, 7); // YYYY-MM

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where: userWhere }),
      this.prisma.user.findMany({
        where: userWhere,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          fullName: true,
          createdAt: true,
          subscription: true,
          usageQuotas: {
            where: { periodKey: currentPeriodKey },
            take: 1,
          },
          quotaOverrides: {
            orderBy: { createdAt: "desc" },
          },
        },
      }),
    ]);

    return {
      data: users.map((u: any) => {
        const sub = u.subscription;
        const usage = u.usageQuotas[0];
        return {
          userId: u.id,
          email: u.email,
          fullName: u.fullName,
          plan: sub?.plan || "FREE",
          status: sub?.status || "ACTIVE",
          currentPeriodStart: sub?.currentPeriodStart || u.createdAt,
          currentPeriodEnd: sub?.currentPeriodEnd || null,
          roundsUsed: usage?.roundsUsed || 0,
          roundsLimit: sub?.plan === "FREE" || !sub ? 3 : null,
          overrides: u.quotaOverrides,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Manually change a candidate's plan tier
   */
  async changeCandidatePlan(userId: string, planSlug: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    const normalizedPlan = (planSlug.toUpperCase() as PlanTier) || "PRO";

    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    return this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan: normalizedPlan,
        status: "ACTIVE",
        currentPeriodStart,
        currentPeriodEnd: normalizedPlan === "FREE" ? null : currentPeriodEnd,
      },
      update: {
        plan: normalizedPlan,
        status: "ACTIVE",
        currentPeriodStart,
        currentPeriodEnd: normalizedPlan === "FREE" ? null : currentPeriodEnd,
      },
    });
  }

  /**
   * Extend an active subscription expiration date
   */
  async extendSubscription(userId: string, daysToAdd: number) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription for user '${userId}' not found`);
    }

    const baseDate = subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) > new Date()
      ? new Date(subscription.currentPeriodEnd)
      : new Date();

    baseDate.setDate(baseDate.getDate() + Number(daysToAdd));

    return this.prisma.subscription.update({
      where: { userId },
      data: {
        currentPeriodEnd: baseDate,
        status: "ACTIVE",
      },
    });
  }

  /**
   * Cancel / revoke a subscription
   */
  async cancelSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription for user '${userId}' not found`);
    }

    return this.prisma.subscription.update({
      where: { userId },
      data: {
        status: "CANCELED",
      },
    });
  }

  /**
   * Grant custom quota override or bonus to a candidate
   */
  async grantQuotaOverride(
    userId: string,
    featureKey: string,
    overrideValue: any,
    reason?: string,
    expiresAt?: Date | string | null,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`);
    }

    return this.prisma.userQuotaOverride.create({
      data: {
        userId,
        featureKey,
        overrideValue,
        reason,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
  }

  /**
   * Delete a custom quota override
   */
  async deleteQuotaOverride(overrideId: string) {
    return this.prisma.userQuotaOverride.delete({
      where: { id: overrideId },
    });
  }
}
