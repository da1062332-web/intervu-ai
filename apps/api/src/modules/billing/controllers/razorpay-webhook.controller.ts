import {
  Controller,
  Post,
  Req,
  Headers,
  UnauthorizedException,
  Logger,
  RawBodyRequest,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiOkResponse } from "@nestjs/swagger";
import { Request } from "express";
import { Public } from "../../auth/decorators/public.decorator";
import { RazorpayService } from "../services/razorpay.service";
import { SubscriptionService } from "../services/subscription.service";
import { PlanManagementService } from "../services/plan-management.service";
import { PlanTier } from "@prisma/client";

@ApiTags("webhooks")
@Controller("webhooks")
export class RazorpayWebhookController {
  private readonly logger = new Logger(RazorpayWebhookController.name);

  constructor(
    private readonly razorpayService: RazorpayService,
    private readonly subscriptionService: SubscriptionService,
    private readonly planManagementService: PlanManagementService,
  ) {}

  /**
   * Looks up the admin-configured price for a plan tier from the database.
   * Used only as a last resort when Razorpay's own payload doesn't carry an amount.
   */
  private async resolvePlanAmount(plan: PlanTier): Promise<number> {
    try {
      const dbPlan = await this.planManagementService.getPlanBySlug(String(plan).toLowerCase());
      return typeof dbPlan?.priceMonthly === "number" ? dbPlan.priceMonthly : 0;
    } catch {
      return 0;
    }
  }

  @Public()
  @Post("razorpay")
  @ApiOperation({ summary: "Handle Razorpay Webhook Events (Signature Verified & Idempotent)" })
  @ApiOkResponse({ description: "Webhook event processed" })
  async handleRazorpayWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("x-razorpay-signature") signature: string,
  ) {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const isValid = this.razorpayService.verifyWebhookSignature(rawBody, signature);

    if (!isValid && process.env.NODE_ENV === "production") {
      this.logger.error("Razorpay webhook signature verification failed");
      throw new UnauthorizedException("Invalid Razorpay signature");
    }

    const event = req.body;
    const eventId = req.headers["x-razorpay-event-id"] as string || event?.id || `evt_${Date.now()}`;
    const eventType = event?.event;

    // 1. Idempotency check for duplicate webhook deliveries
    if (eventId) {
      const alreadyProcessed = await this.subscriptionService.isWebhookEventProcessed(eventId);
      if (alreadyProcessed) {
        this.logger.log(`[IDEMPOTENT WEBHOOK] Event ${eventId} (${eventType}) was already processed. Skipping.`);
        return { received: true, status: "already_processed" };
      }
    }

    this.logger.log(`Received Razorpay webhook event: ${eventType} (ID: ${eventId})`);

    try {
      switch (eventType) {
        case "payment.captured":
        case "order.paid": {
          const payment = event.payload?.payment?.entity || event.payload?.order?.entity;
          const notes = payment?.notes || {};
          const userId = notes?.userId || notes?.user_id;
          const orderId = payment?.order_id || payment?.id;

          if (userId) {
            // The order record (created server-side, priced from the Plan table) is the
            // authoritative source for plan tier - notes.plan is only a fallback.
            const orderRecord = orderId ? await this.subscriptionService.getOrderPlan(orderId) : null;
            const plan = orderRecord?.plan || (notes?.plan?.toUpperCase() as PlanTier) || PlanTier.PRO;
            // payment.amount is the actual amount Razorpay captured - always prefer it for
            // bookkeeping; only fall back to the DB-configured plan price if it's absent.
            const amount = payment?.amount || orderRecord?.amount || (await this.resolvePlanAmount(plan));

            await this.subscriptionService.processPaymentSuccess({
              userId,
              plan,
              razorpayPaymentId: payment?.id || `pay_${Date.now()}`,
              razorpayOrderId: orderId,
              razorpayCustomerId: payment?.customer_id,
              amount,
              currency: payment?.currency || orderRecord?.currency || "INR",
              source: "WEBHOOK",
              webhookEventId: eventId,
              webhookEventType: eventType,
              eventPayload: event,
            });
          }
          break;
        }

        case "payment.failed": {
          const payment = event.payload?.payment?.entity;
          const notes = payment?.notes || {};
          const userId = notes?.userId || notes?.user_id;
          if (userId && payment?.id) {
            await this.subscriptionService.handlePaymentFailure({
              userId,
              razorpayPaymentId: payment.id,
              razorpayOrderId: payment.order_id,
              amount: payment.amount,
              eventPayload: event,
            });
          }
          break;
        }

        case "subscription.activated":
        case "subscription.charged": {
          const sub = event.payload?.subscription?.entity;
          const notes = sub?.notes || {};
          const userId = notes?.userId || notes?.user_id;
          const plan = (notes?.plan?.toUpperCase() as PlanTier) || PlanTier.PRO;

          if (userId) {
            const periodEnd = sub?.current_end
              ? new Date(sub.current_end * 1000)
              : undefined;

            await this.subscriptionService.processPaymentSuccess({
              userId,
              plan,
              razorpayPaymentId: `sub_charge_${sub?.id}_${Date.now()}`,
              razorpayOrderId: sub?.id,
              razorpayCustomerId: sub?.customer_id,
              currentPeriodEnd: periodEnd,
              amount: await this.resolvePlanAmount(plan),
              currency: "INR",
              source: "WEBHOOK",
              webhookEventId: eventId,
              webhookEventType: eventType,
              eventPayload: event,
            });
          }
          break;
        }

        case "subscription.cancelled":
        case "subscription.halted": {
          const sub = event.payload?.subscription?.entity;
          if (sub?.id) {
            await this.subscriptionService.cancelSubscriptionByRazorpayId(sub.id);
          }
          break;
        }

        default:
          this.logger.debug(`Unhandled Razorpay event: ${eventType}`);
      }

      // Record event as processed
      if (eventId) {
        await this.subscriptionService.recordWebhookEvent(eventId, eventType);
      }

      return { received: true, status: "ok" };
    } catch (error) {
      this.logger.error("Error processing Razorpay webhook event:", error);
      return { received: true, status: "error", message: (error as Error).message };
    }
  }
}
