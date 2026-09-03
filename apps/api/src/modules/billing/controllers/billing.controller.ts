import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";
import {
  CreateCheckoutDto,
  CreateOrderDto,
  CreateOrderResponse,
  VerifyPaymentDto,
  VerifyPaymentResponse,
  SubscriptionStatusResponse,
  UserEntitlements,
  CheckoutSessionResponse,
} from "@intervu-ai/contracts";
import { SubscriptionService } from "../services/subscription.service";
import { EntitlementService } from "../services/entitlement.service";
import { RazorpayService } from "../services/razorpay.service";
import { PlanManagementService } from "../services/plan-management.service";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { Public } from "../../auth/decorators/public.decorator";
import { UserRole, PlanTier } from "@prisma/client";

@ApiTags("billing")
@Controller("billing")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CANDIDATE)
@ApiBearerAuth("jwt-auth")
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly entitlementService: EntitlementService,
    private readonly razorpayService: RazorpayService,
    private readonly planManagementService: PlanManagementService,
  ) {}

  @Get("plans")
  @Public()
  @ApiOperation({ summary: "Get all active public subscription plans with dynamic features" })
  async getPublicPlans() {
    return this.planManagementService.getPublicPlans();
  }

  @Get("me")
  @ApiOperation({ summary: "Get current user subscription status and active state" })
  @ApiOkResponse({ description: "Subscription status summary" })
  async getMySubscription(
    @CurrentUser() user: AuthUser,
  ): Promise<SubscriptionStatusResponse> {
    return this.subscriptionService.getSubscriptionStatus(user.id);
  }

  @Get("me/entitlements")
  @ApiOperation({ summary: "Get fully computed entitlements and features for active user tier" })
  @ApiOkResponse({ description: "Calculated feature entitlements and usage" })
  async getMyEntitlements(
    @CurrentUser() user: AuthUser,
  ): Promise<UserEntitlements> {
    return this.entitlementService.getUserEntitlements(user.id);
  }

  @Post("subscribe-free")
  @ApiOperation({ summary: "Select and activate the Free tier for a candidate" })
  @ApiOkResponse({ description: "Free subscription activated successfully" })
  async subscribeFree(@CurrentUser() user: AuthUser) {
    const subscription = await this.subscriptionService.subscribeFree(user.id);
    const entitlements = await this.entitlementService.getUserEntitlements(user.id);
    return {
      success: true,
      subscription,
      entitlements,
    };
  }

  @Post("create-order")
  @ApiOperation({ summary: "Create a Razorpay order for Standard Web Checkout" })
  @ApiOkResponse({ description: "Razorpay order creation response" })
  async createOrder(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateOrderDto,
  ): Promise<CreateOrderResponse> {
    const planType: any = dto.plan || "PRO";
    const order = await this.razorpayService.createOrder({
      userId: user.id,
      email: user.email,
      plan: planType,
      amount: dto.amount,
      currency: dto.currency,
      receipt: dto.receipt,
    });

    // Record local pending order transaction for strict DB ownership validation
    await this.subscriptionService.recordPendingOrder({
      userId: user.id,
      razorpayOrderId: order.order_id,
      amount: order.amount,
      currency: order.currency,
      plan: planType,
    });

    return order;
  }

  @Post("verify-payment")
  @ApiOperation({ summary: "Verify Razorpay payment signature and activate subscription" })
  @ApiOkResponse({ description: "Payment verification result" })
  async verifyPayment(
    @CurrentUser() user: AuthUser,
    @Body() dto: VerifyPaymentDto,
  ): Promise<VerifyPaymentResponse> {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = dto;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new BadRequestException("Missing required payment verification fields");
    }

    try {
      // 1. Validate local DB order ownership
      await this.subscriptionService.validateOrderOwnership(user.id, razorpay_order_id);

      // 2. Cryptographic signature check
      const isValid = this.razorpayService.verifyPaymentSignature({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      if (!isValid) {
        this.logger.warn(
          `Payment verification failed: invalid HMAC signature for Order ${razorpay_order_id}, Payment ${razorpay_payment_id}`,
        );
        throw new BadRequestException("Invalid payment signature. Verification failed.");
      }

      // Safe plan tier normalization
      let plan: PlanTier = PlanTier.PRO;
      if (dto.plan) {
        const upper = String(dto.plan).toUpperCase();
        if (upper === "TEAMS") plan = PlanTier.TEAMS;
        else if (upper === "FREE") plan = PlanTier.FREE;
        else plan = PlanTier.PRO;
      }

      let amount = plan === PlanTier.PRO ? 240000 : 650000;
      try {
        if (dto.plan) {
          const dbPlan = await this.planManagementService.getPlanBySlug(String(dto.plan).toLowerCase());
          if (dbPlan && typeof dbPlan.priceMonthly === "number") {
            amount = dbPlan.priceMonthly;
          }
        }
      } catch {
        // Fallback to default tier amount
      }

      const subscription = await this.subscriptionService.processPaymentSuccess({
        userId: user.id,
        plan,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpaySignature: razorpay_signature,
        amount,
        currency: "INR",
        source: "CLIENT_CALLBACK",
        eventPayload: { verificationType: "client_signature_verified", ...dto },
      });

      const entitlements = await this.entitlementService.getUserEntitlements(user.id);

      return {
        success: true,
        message: "Payment verified and subscription activated successfully",
        subscription,
        entitlements,
      };
    } catch (err: any) {
      this.logger.error(
        `Error during payment verification for user ${user.id} and order ${razorpay_order_id}: ${err.message}`,
        err.stack,
      );
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException(err.message || "Payment verification failed");
    }
  }

  @Post("create-checkout")
  @ApiOperation({ summary: "Create a Razorpay checkout session for Pro or Teams plan" })
  @ApiOkResponse({ description: "Checkout session configuration" })
  async createCheckout(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCheckoutDto,
  ): Promise<CheckoutSessionResponse> {
    const planType: any = dto.plan || "PRO";
    return this.razorpayService.createCheckoutSession({
      userId: user.id,
      email: user.email,
      plan: planType,
      billingCycle: dto.billingCycle,
    });
  }
}
