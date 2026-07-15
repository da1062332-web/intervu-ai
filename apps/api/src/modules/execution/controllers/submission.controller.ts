import {
  Controller,
  Post,
  Param,
  Query,
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
import { SubmissionService } from "../services/submission.service";

import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("execution")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("jwt-auth")
@Roles(UserRole.CANDIDATE, UserRole.ADMIN)
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
    @Query("autoSubmit") autoSubmit?: string,
    @Query("allowPartial") allowPartial?: string,
  ): Promise<any> {
    const isAutoSubmit = autoSubmit === "true" || allowPartial === "true";
    return this.submissionService.submitAssessment(id, user.id, isAutoSubmit);
  }
}
