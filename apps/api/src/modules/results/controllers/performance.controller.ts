import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { ResponseInterceptor } from "@intervu/shared";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { PerformanceService } from "../services/performance.service";
import { HistoryPaginationDto } from "@intervu/shared";

import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("Performance")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
@Roles(UserRole.ADMIN, UserRole.CANDIDATE)
@Controller("users/me")
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get("performance-summary")
  @ApiOperation({ summary: "Get candidate performance summary" })
  @ApiResponse({
    status: 200,
    description: "Performance summary retrieved successfully",
  })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  async getPerformanceSummary(@CurrentUser() user: { id: string }) {
    return this.performanceService.getPerformanceSummary(user.id);
  }

  @Get("history")
  @ApiOperation({ summary: "Get candidate assessment history" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: "Assessment history retrieved successfully",
  })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  async getHistory(
    @CurrentUser() user: { id: string },
    @Query() paginationDto: HistoryPaginationDto,
  ) {
    return this.performanceService.getHistory(user.id, paginationDto);
  }
}
