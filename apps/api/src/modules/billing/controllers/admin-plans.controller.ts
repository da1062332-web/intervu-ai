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
import { UserRole } from "@prisma/client";
import { PlanManagementService } from "../services/plan-management.service";
import {
  CreatePlanDto,
  UpdatePlanDto,
  CreatePlanFeatureDto,
  UpdatePlanFeatureDto,
} from "@intervu-ai/contracts";

@ApiTags("admin-billing")
@Controller("admin/plans")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.PLAN_MANAGER)
@ApiBearerAuth("jwt-auth")
export class AdminPlansController {
  constructor(private readonly planManagementService: PlanManagementService) {}

  @Get()
  @ApiOperation({ summary: "Get all subscription plans with features (Admin & Plan Manager)" })
  async getPlans(@Query("includeInactive") includeInactive?: string) {
    const isInactiveIncluded = includeInactive === "true" || includeInactive === "1";
    return this.planManagementService.getAllPlans(isInactiveIncluded);
  }

  @Get("available-assessments")
  @ApiOperation({ summary: "Get all active assessments available for assignment" })
  async getAvailableAssessments() {
    return this.planManagementService.getAvailableAssessments();
  }

  @Post()
  @ApiOperation({ summary: "Create a new subscription plan" })
  async createPlan(@Body() dto: CreatePlanDto) {
    return this.planManagementService.createPlan(dto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update an existing subscription plan" })
  async updatePlan(@Param("id") id: string, @Body() dto: UpdatePlanDto) {
    return this.planManagementService.updatePlan(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a subscription plan" })
  async deletePlan(@Param("id") id: string) {
    return this.planManagementService.deletePlan(id);
  }

  @Post(":id/features")
  @ApiOperation({ summary: "Add a feature limitation to a plan" })
  async addFeature(
    @Param("id") id: string,
    @Body() dto: CreatePlanFeatureDto,
  ) {
    return this.planManagementService.addFeature(id, dto);
  }

  @Put(":id/features/:featureId")
  @ApiOperation({ summary: "Update a feature limitation rule on a plan" })
  async updateFeature(
    @Param("id") id: string,
    @Param("featureId") featureId: string,
    @Body() dto: UpdatePlanFeatureDto,
  ) {
    return this.planManagementService.updateFeature(id, featureId, dto);
  }

  @Delete(":id/features/:featureId")
  @ApiOperation({ summary: "Delete a feature limitation from a plan" })
  async deleteFeature(
    @Param("id") id: string,
    @Param("featureId") featureId: string,
  ) {
    return this.planManagementService.deleteFeature(id, featureId);
  }
}
