import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { DashboardService } from '../services/dashboard.service';
import { DashboardStatsEntity } from '../entities/dashboard-stats.entity';
import { DashboardAnalyticsSummaryEntity } from '../entities/dashboard-analytics-summary.entity';
import { DashboardActivityItemEntity } from '../entities/dashboard-activity-item.entity';

@ApiTags('dashboard')
@ApiBearerAuth('jwt-auth')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics summary for the authenticated user' })
  @ApiOkResponse({
    description: 'Dashboard statistics summary containing test counts and scores',
    type: DashboardStatsEntity,
  })
  async getStats(@CurrentUser() user: AuthUser): Promise<DashboardStatsEntity> {
    return this.dashboardService.getStats(user.id);
  }

  @Get('analytics-summary')
  @ApiOperation({ summary: 'Get aggregated skill analytics summary for the authenticated user' })
  @ApiOkResponse({
    description: 'Aggregated analytics breakdown scores across multiple metrics',
    type: DashboardAnalyticsSummaryEntity,
  })
  async getAnalyticsSummary(
    @CurrentUser() user: AuthUser,
  ): Promise<DashboardAnalyticsSummaryEntity> {
    return this.dashboardService.getAnalyticsSummary(user.id);
  }

  @Get('recent-activity')
  @ApiOperation({ summary: 'Get a feed of recent activity items for the authenticated user' })
  @ApiOkResponse({
    description: 'List of recent activities performed by the user',
    type: [DashboardActivityItemEntity],
  })
  async getRecentActivity(
    @CurrentUser() user: AuthUser,
  ): Promise<DashboardActivityItemEntity[]> {
    return this.dashboardService.getRecentActivity(user.id);
  }
}
