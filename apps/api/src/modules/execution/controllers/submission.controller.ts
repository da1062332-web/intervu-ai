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
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { CurrentUser } from "@/modules/auth/decorators/current-user.decorator";
import { AuthUser } from "@/modules/auth/interfaces/auth-user.interface";
import { SubmissionService } from "../services/submission.service";

import { Roles } from "@/modules/auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("execution")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("jwt-auth")
@Roles(UserRole.CANDIDATE)
@Controller("tests")
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  @Post(":id/submit")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Submit an assessment" })
  @ApiParam({ name: "id", type: "string", description: "The test instance ID" })
  @ApiResponse({
    status: 200,
    description: "Assessment submitted successfully",
  })
  @ApiResponse({ status: 409, description: "Assessment already submitted" })
  async submitAssessment(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    return this.submissionService.submitAssessment(id, user.id, false);
  }
}
