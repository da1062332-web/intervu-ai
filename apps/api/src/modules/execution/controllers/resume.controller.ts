import {
  Controller,
  Get,
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
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { CurrentUser } from "@/modules/auth/decorators/current-user.decorator";
import { AuthUser } from "@/modules/auth/interfaces/auth-user.interface";
import { ResumeService } from "../services/resume.service";

import { Roles } from "@/modules/auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("execution")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("jwt-auth")
@Roles(UserRole.CANDIDATE)
@Controller("tests")
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Get(":id/resume")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Resume an assessment" })
  @ApiParam({ name: "id", type: "string", description: "The test instance ID" })
  @ApiResponse({ status: 200, description: "Assessment resumed successfully" })
  async resumeAssessment(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    return this.resumeService.resumeAssessment(id, user.id);
  }
}
