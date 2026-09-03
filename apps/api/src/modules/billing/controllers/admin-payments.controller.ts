import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole, PaymentStatus } from "@prisma/client";
import { PaymentManagementService } from "../services/payment-management.service";

@ApiTags("admin-billing")
@Controller("admin/payments")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.PLAN_MANAGER)
@ApiBearerAuth("jwt-auth")
export class AdminPaymentsController {
  constructor(private readonly paymentManagementService: PaymentManagementService) {}

  @Get("transactions")
  @ApiOperation({ summary: "Get paginated payment transactions with search and filter" })
  async getTransactions(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: PaymentStatus,
    @Query("search") search?: string,
  ) {
    return this.paymentManagementService.getTransactionHistory({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      status,
      search,
    });
  }

  @Get("stats")
  @ApiOperation({ summary: "Get revenue metrics and transaction summary statistics" })
  async getStats() {
    return this.paymentManagementService.getPaymentStats();
  }

  @Post("manual-verify")
  @ApiOperation({ summary: "Manually verify and activate a pending transaction" })
  async manualVerify(@Body("transactionId") transactionId: string) {
    return this.paymentManagementService.manualVerifyPayment(transactionId);
  }

  @Get("webhooks")
  @ApiOperation({ summary: "Get audit logs of processed Razorpay webhook events" })
  async getWebhooks(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.paymentManagementService.getWebhookEvents(
      page ? Number(page) : 1,
      limit ? Number(limit) : 25,
    );
  }

  @Post("webhooks/simulate-test")
  @ApiOperation({ summary: "Simulate a Razorpay test webhook ping" })
  async simulateWebhook() {
    return this.paymentManagementService.simulateTestWebhook();
  }
}
