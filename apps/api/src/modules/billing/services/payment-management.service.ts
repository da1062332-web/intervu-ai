import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { SubscriptionService } from "./subscription.service";
import { PaymentStatus, PlanTier } from "@prisma/client";

@Injectable()
export class PaymentManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  /**
   * Get paginated transaction history with filtering
   */
  async getTransactionHistory(params: {
    page?: number;
    limit?: number;
    status?: PaymentStatus;
    search?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) {
      where.status = params.status;
    }

    if (params.search) {
      where.OR = [
        { razorpayPaymentId: { contains: params.search, mode: "insensitive" } },
        { razorpayOrderId: { contains: params.search, mode: "insensitive" } },
        { user: { email: { contains: params.search, mode: "insensitive" } } },
        { user: { fullName: { contains: params.search, mode: "insensitive" } } },
      ];
    }

    const [total, transactions] = await Promise.all([
      this.prisma.paymentTransaction.count({ where }),
      this.prisma.paymentTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, email: true, fullName: true },
          },
          subscription: {
            select: { plan: true, status: true },
          },
        },
      }),
    ]);

    return {
      data: transactions.map((tx: any) => ({
        id: tx.id,
        userId: tx.userId,
        userEmail: tx.user.email,
        userName: tx.user.fullName,
        razorpayPaymentId: tx.razorpayPaymentId,
        razorpayOrderId: tx.razorpayOrderId,
        amount: tx.amount,
        currency: tx.currency,
        status: tx.status,
        plan: tx.subscription?.plan || (tx.eventPayload as any)?.plan || "PRO",
        source: (tx.eventPayload as any)?.source || "RAZORPAY",
        createdAt: tx.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get payment revenue analytics and statistics
   */
  async getPaymentStats() {
    const [totalVolume, successfulCount, pendingCount, failedCount] = await Promise.all([
      this.prisma.paymentTransaction.aggregate({
        where: { status: PaymentStatus.SUCCESS },
        _sum: { amount: true },
      }),
      this.prisma.paymentTransaction.count({
        where: { status: PaymentStatus.SUCCESS },
      }),
      this.prisma.paymentTransaction.count({
        where: { status: PaymentStatus.PENDING },
      }),
      this.prisma.paymentTransaction.count({
        where: { status: PaymentStatus.FAILED },
      }),
    ]);

    // Active paid subscribers for MRR estimation, grouped by plan tier so each
    // tier is weighted by its actual admin-configured price (never a flat guess).
    const activeByPlan = await this.prisma.subscription.groupBy({
      by: ["plan"],
      where: {
        status: "ACTIVE",
        plan: { in: ["PRO", "TEAMS"] },
      },
      _count: { _all: true },
    });

    const activePaidCount = activeByPlan.reduce((sum, g) => sum + g._count._all, 0);

    let mrrEstimatePaise = 0;
    for (const group of activeByPlan) {
      const dbPlan = await this.prisma.plan.findFirst({
        where: { slug: String(group.plan).toLowerCase() },
      });
      mrrEstimatePaise += (dbPlan?.priceMonthly || 0) * group._count._all;
    }

    return {
      totalVolumePaise: totalVolume._sum.amount || 0,
      successfulCount,
      pendingCount,
      failedCount,
      activePaidCount,
      mrrEstimatePaise,
    };
  }

  /**
   * Manually verify and activate a pending transaction (Plan Manager fallback)
   */
  async manualVerifyPayment(transactionId: string) {
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID '${transactionId}' not found`);
    }

    if (transaction.status === PaymentStatus.SUCCESS) {
      return { success: true, message: "Transaction is already marked as SUCCESS" };
    }

    const plan: PlanTier = ((transaction.eventPayload as any)?.plan as PlanTier) || "PRO";

    const subscription = await this.subscriptionService.processPaymentSuccess({
      userId: transaction.userId,
      plan,
      razorpayPaymentId: transaction.razorpayPaymentId,
      razorpayOrderId: transaction.razorpayOrderId || undefined,
      amount: transaction.amount,
      currency: transaction.currency,
      source: "ADMIN_MANUAL_VERIFICATION",
      eventPayload: {
        verifiedBy: "PLAN_MANAGER",
        originalPayload: transaction.eventPayload,
      },
    });

    return {
      success: true,
      message: "Transaction manually verified and subscription activated successfully",
      subscription,
    };
  }

  /**
   * Get processed webhook logs
   */
  async getWebhookEvents(page = 1, limit = 25) {
    const skip = (page - 1) * limit;

    const [total, events] = await Promise.all([
      this.prisma.processedWebhookEvent.count(),
      this.prisma.processedWebhookEvent.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      data: events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Simulate receiving a test webhook event for development & audit verification
   */
  async simulateTestWebhook() {
    const eventId = `evt_test_${Date.now()}`;
    const eventType = "payment.captured";
    const created = await this.prisma.processedWebhookEvent.create({
      data: {
        eventId,
        eventType,
      },
    });
    return { success: true, event: created };
  }
}
