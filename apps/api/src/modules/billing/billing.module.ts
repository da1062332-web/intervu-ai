import { Module, Global } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BillingController } from "./controllers/billing.controller";
import { RazorpayWebhookController } from "./controllers/razorpay-webhook.controller";
import { AdminPlansController } from "./controllers/admin-plans.controller";
import { AdminPaymentsController } from "./controllers/admin-payments.controller";
import { AdminSubscriptionsController } from "./controllers/admin-subscriptions.controller";
import { SubscriptionService } from "./services/subscription.service";
import { UsageQuotaService } from "./services/usage-quota.service";
import { EntitlementService } from "./services/entitlement.service";
import { RazorpayService } from "./services/razorpay.service";
import { PlanManagementService } from "./services/plan-management.service";
import { PaymentManagementService } from "./services/payment-management.service";
import { SubscriptionAdminService } from "./services/subscription-admin.service";
import { EntitlementGuard } from "./guards/entitlement.guard";
import { QuotaGuard } from "./guards/quota.guard";

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [
    BillingController,
    RazorpayWebhookController,
    AdminPlansController,
    AdminPaymentsController,
    AdminSubscriptionsController,
  ],
  providers: [
    SubscriptionService,
    UsageQuotaService,
    EntitlementService,
    RazorpayService,
    PlanManagementService,
    PaymentManagementService,
    SubscriptionAdminService,
    EntitlementGuard,
    QuotaGuard,
  ],
  exports: [
    SubscriptionService,
    UsageQuotaService,
    EntitlementService,
    RazorpayService,
    PlanManagementService,
    PaymentManagementService,
    SubscriptionAdminService,
    EntitlementGuard,
    QuotaGuard,
  ],
})
export class BillingModule {}
