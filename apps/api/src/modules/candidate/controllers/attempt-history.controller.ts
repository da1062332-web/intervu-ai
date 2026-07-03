import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";
import { AttemptHistoryService } from "../services/attempt-history.service";
import { AttemptHistoryResponseDto } from "../dto/attempt-history.dto";

@ApiTags("candidate-attempts")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CANDIDATE)
@Controller("candidate/attempts")
export class AttemptHistoryController {
  constructor(private readonly attemptHistoryService: AttemptHistoryService) {}

  @Get()
  @ApiOperation({ summary: "Get candidate attempt history" })
  @ApiOkResponse({ type: AttemptHistoryResponseDto })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getAttemptHistory(
    @CurrentUser() user: AuthUser,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ): Promise<AttemptHistoryResponseDto> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.attemptHistoryService.getAttemptHistory(
      user.id,
      pageNum,
      limitNum,
    );
  }
}
