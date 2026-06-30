import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ValidateResponse } from "@intervu/shared";
import { z } from "zod";
import { EvaluationService } from "../services/evaluation.service";
import { EvaluationQueueService } from "../services/evaluation-queue.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("evaluation")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN, UserRole.CANDIDATE)
@Controller("evaluation")
export class EvaluationController {
  constructor(
    private readonly evaluationService: EvaluationService,
    private readonly evaluationQueueService: EvaluationQueueService,
  ) {}

  @Post(":answerId/evaluate")
  @HttpCode(HttpStatus.OK)
  @ValidateResponse(z.unknown())
  @ApiOperation({ summary: "Trigger evaluation for an answer" })
  async evaluateAnswer(@Param("answerId") answerId: string) {
    return this.evaluationService.evaluateAnswer(answerId);
  }

  @Get(":answerId")
  @HttpCode(HttpStatus.OK)
  @ValidateResponse(z.unknown())
  @ApiOperation({ summary: "Get evaluation result" })
  async getEvaluation(@Param("answerId") answerId: string) {
    return this.evaluationService.getEvaluation(answerId);
  }

  @Post("queue")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Queue evaluation for a test attempt" })
  async enqueueEvaluation(
    @Body() body: { attemptId: string; userId: string; answers: Record<string, string> }
  ) {
    // Generate a fallback submission ID if not already existing
    const submissionId = `sub-${body.attemptId}`;
    return this.evaluationQueueService.enqueueSubmission(
      submissionId,
      body.attemptId,
      body.userId,
      body.answers,
    );
  }

  @Get(":attemptId/status")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Check evaluation queue status for an attempt" })
  async getEvaluationStatus(@Param("attemptId") attemptId: string) {
    return this.evaluationQueueService.getEvaluationStatus(attemptId);
  }

  @Post(":attemptId/retry")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Retry a failed evaluation" })
  async retryFailedEvaluation(@Param("attemptId") attemptId: string) {
    return this.evaluationQueueService.retryFailedEvaluation(attemptId);
  }
}

