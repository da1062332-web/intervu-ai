import {
  Controller,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
import { SubmissionService } from "../services/submission.service";
// eslint-disable-next-line no-restricted-imports
import { CandidateAnswerDto } from "../dto";

@ApiTags("execution")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("jwt-auth")
@Controller("tests")
export class AnswerController {
  constructor(
    private readonly answerService: AnswerService,
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    const result = await this.answerService.saveAnswer(id, user.id, dto);

    if (result.status === "expired") {
      // Authoritative timer expired -> Automatically submit
      await this.submissionService.submitAssessment(id, user.id, true);
      // Return frontend friendly state instead of throwing exception
      return { 
        status: "EXPIRED_AND_SUBMITTED", 
        message: "Assessment timer expired. Assessment has been automatically submitted."
      };
    }

    return result;
  }
}
