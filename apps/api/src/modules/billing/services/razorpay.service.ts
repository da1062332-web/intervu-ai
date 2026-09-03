import {
  Injectable,
  Logger,
  BadRequestException,
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

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private readonly keyId: string;
  private readonly keySecret: string;
  private readonly webhookSecret: string;
  private readonly razorpayInstance: Razorpay | null = null;

  constructor(private readonly configService: ConfigService) {
    this.keyId = this.configService.get<string>("RAZORPAY_KEY_ID") || "";
    this.keySecret = this.configService.get<string>("RAZORPAY_KEY_SECRET") || "";
    this.webhookSecret = this.configService.get<string>("RAZORPAY_WEBHOOK_SECRET") || "";

    if (process.env.NODE_ENV === "production") {
      if (!this.keyId || this.keyId.startsWith("rzp_test_")) {
        this.logger.error("CRITICAL: Test Razorpay credentials detected in PRODUCTION environment!");
        throw new Error("Invalid Razorpay credentials: test keys cannot be used in production.");
      }
    }

    if (this.keyId && this.keySecret) {
      try {
        this.razorpayInstance = new Razorpay({
          key_id: this.keyId,
          key_secret: this.keySecret,
        });
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
    plan?: "PRO" | "TEAMS";
    amount?: number; // In paise
    currency?: string;
    receipt?: string;
  }): Promise<CreateOrderResponse> {
    const { userId, email, plan = "PRO" } = params;

    // Default prices in paise: Pro = 240000 paise (₹2,400), Teams = 650000 paise (₹6,500)
    const defaultAmount = plan === "PRO" ? 240000 : 650000;
    const amount = params.amount || defaultAmount;
    const currency = params.currency || "INR";

    if (amount < 100) {
      throw new BadRequestException("Minimum order amount must be at least 100 paise (₹1)");
    }

    const receipt =
      params.receipt || `rcpt_${plan.toLowerCase()}_${Date.now()}_${userId.slice(-6)}`;

    try {
      let orderId = `order_${plan.toLowerCase()}_${Date.now()}_${userId.slice(-6)}`;

      if (this.razorpayInstance) {
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
        orderId = order.id;
      }

      this.logger.log(`Created Razorpay order ${orderId} for user ${userId} (${plan}: ₹${amount / 100})`);

      return {
        order_id: orderId,
        orderId,
        amount,
        currency,
        keyId: this.keyId,
        plan,
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
