import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";
import { CandidateDashboardService } from "../services/candidate-dashboard.service";
import { CandidateDashboardResponseDto } from "../dto/candidate-dashboard.dto";

@ApiTags("candidate-dashboard")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CANDIDATE)
@Controller("candidate/dashboard")
export class CandidateDashboardController {
  constructor(private readonly dashboardService: CandidateDashboardService) {}

  @Get()
  @ApiOperation({ summary: "Get candidate dashboard data" })
  @ApiOkResponse({ type: CandidateDashboardResponseDto })
  async getDashboard(
    @CurrentUser() user: AuthUser,
  ): Promise<CandidateDashboardResponseDto> {
    return this.dashboardService.getDashboardData(user.id);
  }
}
