import {
  Controller,
  Get,
  Post,
  Param,
  Body,
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
import { ExecutionService } from "../services/execution.service";
import { ExecutionValidatorService } from "../services/execution-validator.service";
import { AssessmentAuditService } from "../services/assessment-audit.service";
import { PrismaService } from "@/prisma/prisma.service";

import { Roles } from "@/modules/auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("execution")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("jwt-auth")
@Roles(UserRole.CANDIDATE, UserRole.ADMIN)
@Controller()
export class ExecutionController {
  constructor(
    private readonly executionService: ExecutionService,
    private readonly validator: ExecutionValidatorService,
    private readonly auditService: AssessmentAuditService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("tests/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Load an assessment snapshot" })
  @ApiParam({ name: "id", type: "string", description: "The test instance ID" })
  @ApiResponse({
    status: 200,
    description: "Assessment loaded successfully",
  })
  @ApiResponse({ status: 404, description: "Assessment not found" })
  async loadAssessment(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<any> {
    return this.executionService.loadAssessment(id, user.id);
  }

  @Post("assessment-sessions/:id/checkpoint")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Create recovery checkpoint snapshot" })
  async createCheckpoint(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: {
      currentSection: string;
      currentQuestion: string;
      remainingTime: number;
      markedQuestions: any;
      visitedQuestions: any;
      autosavedAnswers: any;
      networkStatusTimestamp: string;
    },
  ) {
    await this.prisma.executionState.upsert({
      where: { testInstanceId: id },
      update: {
        currentSectionKey: body.currentSection,
        currentQuestionId: body.currentQuestion,
        remainingTimeSeconds: body.remainingTime,
        markedQuestions: body.markedQuestions,
        visitedQuestions: body.visitedQuestions,
        networkStatusTimestamp: new Date(body.networkStatusTimestamp),
      },
      create: {
        testInstanceId: id,
        currentQuestionIndex: 0,
        currentSectionKey: body.currentSection,
        currentQuestionId: body.currentQuestion,
        remainingTimeSeconds: body.remainingTime,
        markedQuestions: body.markedQuestions,
        visitedQuestions: body.visitedQuestions,
        networkStatusTimestamp: new Date(body.networkStatusTimestamp),
      },
    });

    await this.auditService.logEvent(id, "CHECKPOINT", body);
    return { success: true };
  }

  @Get("assessment-sessions/:id/resume")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Resume candidate session recovery" })
  async resumeCheckpoint(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const state = await this.prisma.executionState.findUnique({
      where: { testInstanceId: id },
    });
    const answers = await this.prisma.candidateAnswer.findMany({
      where: { testInstanceId: id },
    });

    await this.auditService.logEvent(id, "RESUME");

    return {
      testInstanceId: id,
      executionState: state,
      answers: answers.map((ans) => ({
        questionId: ans.questionId,
        answer: ans.answer,
        timeSpentSeconds: ans.timeSpentSeconds,
        isMarkedForReview: ans.isMarkedForReview,
        savedAt: ans.savedAt,
      })),
    };
  }

  @Get("assessment-sessions/:id/status")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Validate active status of assessment session" })
  async getSessionStatus(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
  ) {
    try {
      await this.validator.validateRuntimeSession(id, user.id);
      return { status: "ACTIVE", isValid: true };
    } catch (error) {
      return {
        status: "INACTIVE",
        isValid: false,
        reason: error instanceof Error ? error.message : "Session validation failed",
      };
    }
  }

  @Post("assessment-sessions/:id/terminate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Terminate active assessment session" })
  async terminateSession(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
  ) {
    await this.prisma.testInstance.update({
      where: { id },
      data: {
        status: "COMPLETED",
        submittedAt: new Date(),
      },
    });

    await this.auditService.logEvent(id, "TERMINATE");
    return { success: true };
  }

  @Get("runtime/:id/validate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Validate runtime session constraints" })
  async validateRuntime(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.validator.validateRuntimeSession(id, user.id);
  }

  @Get("assessment-audit/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Retrieve audit trail of assessment actions" })
  async getAuditTrail(@Param("id") id: string) {
    return this.auditService.getAuditTrail(id);
  }
}

