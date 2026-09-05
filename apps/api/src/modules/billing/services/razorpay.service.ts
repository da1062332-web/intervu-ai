import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import Razorpay from "razorpay";
import {
  CheckoutSessionResponse,
  CreateOrderResponse,
  PlanTier,
} from "@intervu-ai/contracts";
import { PlanManagementService } from "./plan-management.service";

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;
  private readonly razorpayInstance: Razorpay | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly planManagementService: PlanManagementService,
  ) {
    this.keyId =
      this.configService.get<string>("RAZORPAY_KEY_ID") ||
      "rzp_live_TX7JsRywgX7pvg";
    this.keySecret =
      this.configService.get<string>("RAZORPAY_KEY_SECRET") ||
      "EpkObpbLlEH9KwLQtu1Gv6aq";
    this.webhookSecret =
      this.configService.get<string>("RAZORPAY_WEBHOOK_SECRET") ||
      "EpkObpbLlEH9KwLQtu1Gv6aq";

    if (this.keyId.startsWith("rzp_test_")) {
      this.logger.warn(
        "⚠️ [RazorpayService] Running with TEST Razorpay credentials (rzp_test_*).",
      );
    }

    if (this.keyId && this.keySecret) {
      try {
        this.razorpayInstance = new Razorpay({
          key_id: this.keyId,
          key_secret: this.keySecret,
        });
        this.logger.log(`Initialized Razorpay client with key: ${this.keyId}`);
      } catch (err) {
        this.logger.warn("Could not instantiate Razorpay SDK client:", err);
      }
    } else {
      this.logger.warn("RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured in environment.");
    }
  }

  getPublicKey(): string {
    return this.keyId;
  }

  /**
   * Creates an order with Razorpay Orders API (POST https://api.razorpay.com/v1/orders)
   */
  async createOrder(params: {
    userId: string;
    email?: string;
    plan?: string;
    amount?: number; // Ignored - price is always resolved server-side from the Plan table
    currency?: string;
    receipt?: string;
  }): Promise<CreateOrderResponse> {
    const { userId, email, plan = "PRO" } = params;

    // Price is always the admin-configured value in the database - never trust a client-supplied amount.
    const { amount } = await this.planManagementService.resolvePlanPricing(plan);
    const currency = params.currency || "INR";

    const receipt =
      params.receipt || `rcpt_${plan.toLowerCase()}_${Date.now()}_${userId.slice(-6)}`;

    try {
      if (!this.razorpayInstance) {
        throw new InternalServerErrorException(
          "Razorpay payment gateway is not initialized. Please verify configuration.",
        );
      }

      const order = await this.razorpayInstance.orders.create({
        amount,
        currency,
        receipt,
        notes: {
          userId,
          email: email || "",
          plan,
        },
      });

      this.logger.log(`Created Razorpay order ${order.id} for user ${userId} (${plan}: ₹${amount / 100})`);

      return {
        order_id: order.id,
        orderId: order.id,
        amount,
        currency,
        keyId: this.keyId,
        plan: plan as any,
      };
    } catch (error: any) {
      this.logger.error("Razorpay order creation failed:", error);
      throw new InternalServerErrorException(
        error?.error?.description || error?.message || "Failed to create Razorpay order",
      );
    }
  }

  /**
   * Verifies standard client payment signature:
   * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
   */
  verifyPaymentSignature(params: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): boolean {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = params;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return false;
    }

    try {
      const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac("sha256", this.keySecret)
        .update(payload)
        .digest("hex");
      const expectedBuffer = Buffer.from(expectedSignature, "utf8");
      const signatureBuffer = Buffer.from(razorpay_signature, "utf8");

      if (expectedBuffer.length !== signatureBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    } catch (error) {
      this.logger.error("Error verifying payment signature:", error);
      return false;
    }
  }

  /**
   * Verifies webhook payload signature:
   * Algorithm: HMAC-SHA256(rawBody, WEBHOOK_SECRET)
   */
  verifyWebhookSignature(
    rawBody: Buffer | string,
    signature: string,
    secret?: string,
  ): boolean {
    const webhookSecret = secret || this.webhookSecret;
    if (!signature || !rawBody) {
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      const expectedBuffer = Buffer.from(expectedSignature, "utf8");
      const signatureBuffer = Buffer.from(signature, "utf8");

      if (expectedBuffer.length !== signatureBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    } catch (error) {
      this.logger.error("Error verifying webhook signature:", error);
      return false;
    }
  }

  async createCheckoutSession(params: {
    userId: string;
    email: string;
    fullName?: string;
    plan: "PRO" | "TEAMS";
    billingCycle?: string;
  }): Promise<CheckoutSessionResponse> {
    const order = await this.createOrder({
      userId: params.userId,
      email: params.email,
      plan: params.plan,
    });

    return {
      orderId: order.orderId,
      keyId: this.keyId,
      amount: order.amount,
      currency: order.currency,
      plan: params.plan,
      user: {
        email: params.email,
        name: params.fullName || "Candidate",
      },
    };
  }
}
