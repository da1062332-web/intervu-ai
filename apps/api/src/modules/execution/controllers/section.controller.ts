import {
  Controller,
  Post,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";
import { SectionAdvanceService } from "../services/section-advance.service";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("execution")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("jwt-auth")
@Roles(UserRole.CANDIDATE, UserRole.ADMIN)
@Controller("tests")
export class SectionController {
  constructor(private readonly sectionAdvanceService: SectionAdvanceService) {}

  @Post(":id/sections/advance")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Advance to the next section (lock current, activate next)",
  })
  @ApiParam({
    name: "id",
    type: "string",
    description: "The test instance ID",
  })
  @ApiResponse({
    status: 200,
    description:
      "Section advanced. If last section, assessment is auto-submitted.",
  })
  @ApiResponse({
    status: 409,
    description: "Transition already in progress",
  })
  @ApiResponse({
    status: 400,
    description: "Already submitted or invalid section state",
  })
  async advanceSection(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.sectionAdvanceService.advanceSection(id, user.id);
  }
}
