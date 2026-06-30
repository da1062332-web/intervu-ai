import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";
import { DashboardService } from "../services/dashboard.service";
import { DashboardStatsEntity } from "../entities/dashboard-stats.entity";
import { DashboardAnalyticsSummaryEntity } from "../entities/dashboard-analytics-summary.entity";
import { DashboardActivityItemEntity } from "../entities/dashboard-activity-item.entity";
 
import { DashboardResponseDto } from "../dto/dashboard-response.dto";

import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("dashboard")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // ─── Sprint 2 Day 1 — Candidate dashboard ──────────────────────────────────

  /**
   * GET /api/v1/dashboard
   *
   * Returns the full candidate dashboard payload in a single response:
   * - availableTests  — all active assessment configs
   * - activeTests     — this user's ONGOING test instances
   * - completedAttempts — this user's last 10 COMPLETED/EVALUATED tests (DESC)
   *
   * The response is wrapped in the standard envelope by ResponseInterceptor.
   */
  @Get()
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({
    summary: "Get candidate dashboard",
    description:
      "Returns available assessments, the candidate's active tests, and their last 10 completed attempts in a single request.",
    operationId: "getDashboard",
  })
  @ApiOkResponse({
    description: "Dashboard payload retrieved successfully",
    type: DashboardResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: "Invalid or missing JWT bearer token",
  })
  async getDashboard(
    @CurrentUser() user: AuthUser,
  ): Promise<DashboardResponseDto> {
    return this.dashboardService.getDashboard(user.id);
  }

  // ─── Existing analytics routes (untouched) ─────────────────────────────────

  @Get("stats")
  @Roles(UserRole.ADMIN, UserRole.CANDIDATE)
  @ApiOperation({
    summary: "Get dashboard statistics summary for the authenticated user",
  })
  @ApiOkResponse({
    description:
      "Dashboard statistics summary containing test counts and scores",
    type: DashboardStatsEntity,
  })
  async getStats(@CurrentUser() user: AuthUser): Promise<DashboardStatsEntity> {
    return this.dashboardService.getStats(user.id);
  }

  @Get("analytics-summary")
  @Roles(UserRole.ADMIN, UserRole.CANDIDATE)
  @ApiOperation({
    summary:
      "Get aggregated skill analytics summary for the authenticated user",
  })
  @ApiOkResponse({
    description:
      "Aggregated analytics breakdown scores across multiple metrics",
    type: DashboardAnalyticsSummaryEntity,
  })
  async getAnalyticsSummary(
    @CurrentUser() user: AuthUser,
  ): Promise<DashboardAnalyticsSummaryEntity> {
    return this.dashboardService.getAnalyticsSummary(user.id);
  }

  @Get("recent-activity")
  @Roles(UserRole.ADMIN, UserRole.CANDIDATE)
  @ApiOperation({
    summary: "Get a feed of recent activity items for the authenticated user",
  })
  @ApiOkResponse({
    description: "List of recent activities performed by the user",
    type: [DashboardActivityItemEntity],
  })
  async getRecentActivity(
    @CurrentUser() user: AuthUser,
  ): Promise<DashboardActivityItemEntity[]> {
    return this.dashboardService.getRecentActivity(user.id);
  }
}
