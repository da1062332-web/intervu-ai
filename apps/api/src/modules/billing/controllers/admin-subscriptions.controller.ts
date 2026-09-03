import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole, SubscriptionStatus } from "@prisma/client";
import { SubscriptionAdminService } from "../services/subscription-admin.service";

@ApiTags("admin-billing")
@Controller("admin/subscriptions")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.PLAN_MANAGER)
@ApiBearerAuth("jwt-auth")
export class AdminSubscriptionsController {
  constructor(private readonly subscriptionAdminService: SubscriptionAdminService) {}

  @Get()
  @ApiOperation({ summary: "Get candidate subscriptions with search and usage filters" })
  async getSubscriptions(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("search") search?: string,
    @Query("plan") plan?: string,
    @Query("status") status?: SubscriptionStatus,
  ) {
    return this.subscriptionAdminService.getCandidateSubscriptions({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search,
      plan,
      status,
    });
  }

  @Put(":userId/plan")
  @ApiOperation({ summary: "Manually change or assign a candidate's plan tier" })
  async changePlan(
    @Param("userId") userId: string,
    @Body("plan") plan: string,
  ) {
    return this.subscriptionAdminService.changeCandidatePlan(userId, plan);
  }

  @Put(":userId/extend")
  @ApiOperation({ summary: "Extend an active candidate subscription by N days" })
  async extendSubscription(
    @Param("userId") userId: string,
    @Body("days") days: number,
  ) {
    return this.subscriptionAdminService.extendSubscription(userId, days || 30);
  }

  @Post(":userId/cancel")
  @ApiOperation({ summary: "Cancel a candidate subscription" })
  async cancelSubscription(@Param("userId") userId: string) {
    return this.subscriptionAdminService.cancelSubscription(userId);
  }

  @Post(":userId/quota-override")
  @ApiOperation({ summary: "Grant custom quota override or bonus to candidate" })
  async grantQuotaOverride(
    @Param("userId") userId: string,
    @Body() body: {
      featureKey: string;
      overrideValue: any;
      reason?: string;
      expiresAt?: string | null;
    },
  ) {
    return this.subscriptionAdminService.grantQuotaOverride(
      userId,
      body.featureKey,
      body.overrideValue,
      body.reason,
      body.expiresAt,
    );
  }

  @Delete("quota-override/:overrideId")
  @ApiOperation({ summary: "Delete a custom quota override" })
  async deleteQuotaOverride(@Param("overrideId") overrideId: string) {
    return this.subscriptionAdminService.deleteQuotaOverride(overrideId);
  }
}
