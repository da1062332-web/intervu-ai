import {
  Controller,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@/modules/auth/guards/jwt-auth.guard";
import { CurrentUser } from "@/modules/auth/decorators/current-user.decorator";
import { AuthUser } from "@/modules/auth/interfaces/auth-user.interface";
import { AnswerService } from "../services/answer.service";
import { AutosaveService } from "../services/autosave.service";
import { SubmissionService } from "../services/submission.service";

import { CandidateAnswerDto } from "../dto";

import { Roles } from "@/modules/auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("execution")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("jwt-auth")
@Roles(UserRole.CANDIDATE)
@Controller("tests")
export class AnswerController {
  constructor(
    private readonly answerService: AnswerService,
    private readonly autosaveService: AutosaveService,
    private readonly submissionService: SubmissionService,
  ) {}

  @Post(":id/answer")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Autosave a candidate answer" })
  @ApiParam({ name: "id", type: "string", description: "The test instance ID" })
  @ApiBody({ type: CandidateAnswerDto })
  @ApiResponse({ status: 200, description: "Answer saved successfully" })
  @ApiResponse({ status: 409, description: "Assessment already submitted" })
  async saveAnswer(
    @Param("id") id: string,
    @Body() dto: CandidateAnswerDto,
    @CurrentUser() user: AuthUser,
  ): Promise<any> {
    const result = await this.autosaveService.saveAnswer(id, user.id, dto);

    if (result.status === "expired") {
      // Authoritative timer expired -> Automatically submit
      await this.submissionService.submitAssessment(id, user.id, true);
      // Return frontend friendly state instead of throwing exception
      return {
        status: "EXPIRED_AND_SUBMITTED",
        message:
          "Assessment timer expired. Assessment has been automatically submitted.",
      };
    }

    return result;
  }
}
