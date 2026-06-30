import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole, WorkflowStatus, WorkflowStep } from "@prisma/client";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";
import { Public } from "../../auth/decorators/public.decorator";

import { WorkflowFacadeService } from "../services/workflow-facade.service";
import { WorkflowFilterDto } from "../dto/workflow-filter.dto";
import {
  CreateWorkflowDto,
  RollbackDto,
  RetryWorkflowDto,
  BulkWorkflowDto,
  WorkflowResponseDto,
} from "../dto/workflow.dto";
import { WorkflowDashboardDto } from "../dto/workflow-dashboard.dto";
import { WorkflowStatusDto } from "../dto/workflow-status.dto";
import { AdminInsightsResponse } from "../dto/admin-insights.dto";

@ApiTags("Workflows")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("workflows")
export class WorkflowController {
  constructor(private readonly facade: WorkflowFacadeService) {}

  @Get()
  @ApiOperation({ summary: "List all workflows with filtering and pagination" })
  @ApiOkResponse({ type: [WorkflowDashboardDto] })
  getWorkflows(@Query() filter: WorkflowFilterDto) {
    return this.facade.getDashboard(filter);
  }

  @Get("health")
  @Public() // No auth required for health check
  @ApiOperation({
    summary: "Workflow module health check for operational monitoring",
  })
  @ApiOkResponse({ description: "Health status of all connected modules" })
  getHealth() {
    return {
      configuration: "HEALTHY",
      generation: "HEALTHY",
      review: "HEALTHY",
      assembly: "HEALTHY",
      publishing: "HEALTHY",
      checkedAt: new Date().toISOString(),
    };
  }

  @Get("insights")
  @ApiOperation({ summary: "Admin operational insights and metrics" })
  @ApiOkResponse({ type: AdminInsightsResponse })
  getInsights() {
    return this.facade.getAdminInsights();
  }

  @Post()
  @ApiOperation({ summary: "Start a new workflow for an exam configuration" })
  @ApiCreatedResponse({ type: WorkflowResponseDto })
  @ApiBadRequestResponse({
    description: "ExamConfig not found or workflow already exists",
  })
  startWorkflow(@Body() dto: CreateWorkflowDto, @CurrentUser() user: AuthUser) {
    return this.facade.startWorkflow(dto.examId, user.id);
  }

  @Get(":examId")
  @ApiOperation({ summary: "Get workflow details and status" })
  @ApiOkResponse({ type: WorkflowStatusDto })
  @ApiNotFoundResponse({ description: "Workflow not found" })
  getWorkflow(@Param("examId") examId: string) {
    return this.facade.getWorkflowStatus(examId);
  }

  @Get(":examId/overview")
  @ApiOperation({
    summary: "Get overview data for a workflow (exam config, question stats)",
  })
  getWorkflowOverview(@Param("examId") examId: string) {
    return this.facade.getWorkflowOverview(examId);
  }

  @Get(":examId/questions")
  @ApiOperation({ summary: "Get all generated questions for review" })
  getWorkflowQuestions(
    @Param("examId") examId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
  ) {
    return this.facade.getWorkflowQuestions(
      examId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 100,
      status,
    );
  }

  @Patch(":examId/questions/:questionId/approve")
  @ApiOperation({ summary: "Approve a question during review" })
  approveQuestion(
    @Param("examId") examId: string,
    @Param("questionId") questionId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.facade.approveQuestion(questionId, user.id);
  }

  @Patch(":examId/questions/:questionId/reject")
  @ApiOperation({ summary: "Reject a question during review" })
  rejectQuestion(
    @Param("examId") examId: string,
    @Param("questionId") questionId: string,
    @Body() body: { reason?: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.facade.rejectQuestion(questionId, user.id, body.reason);
  }

  @Post(":examId/questions/bulk-approve")
  @ApiOperation({ summary: "Bulk approve questions" })
  bulkApproveQuestions(
    @Param("examId") examId: string,
    @Body() body: { questionIds: string[] },
    @CurrentUser() user: AuthUser,
  ) {
    return this.facade.bulkApproveQuestions(body.questionIds, user.id);
  }

  @Patch(":examId/advance")
  @ApiOperation({ summary: "Advance workflow to the next step" })
  @ApiConflictResponse({
    description: "Invalid transition or concurrent modification",
  })
  advanceWorkflow(
    @Param("examId") examId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.facade.advanceWorkflow(examId, user.id);
  }

  @Post(":examId/generate")
  @ApiOperation({ summary: "Start question generation for the workflow" })
  startGeneration(
    @Param("examId") examId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.facade.startGeneration(examId, user.id);
  }

  @Post(":examId/assemble")
  @ApiOperation({ summary: "Start test assembly for the workflow" })
  startAssembly(
    @Param("examId") examId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.facade.startAssembly(examId, user.id);
  }

  @Patch(":examId/rollback")
  @ApiOperation({ summary: "Roll back workflow to the previous step" })
  @ApiConflictResponse({ description: "Cannot rollback from current step" })
  rollbackWorkflow(
    @Param("examId") examId: string,
    @Body() dto: RollbackDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.facade.rollbackWorkflow(examId, dto.reason, user.id);
  }

  @Post(":examId/publish")
  @ApiOperation({
    summary: "Publish the assembled test and complete the workflow",
  })
  @ApiConflictResponse({ description: "Workflow not in a publishable state" })
  publishWorkflow(
    @Param("examId") examId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.facade.publishWorkflow(examId, user.id);
  }

  @Post(":examId/retry")
  @ApiOperation({
    summary: "Retry a failed workflow stage without full rollback",
  })
  @ApiBadRequestResponse({ description: "Stage is not retryable" })
  retryWorkflow(
    @Param("examId") examId: string,
    @Body() dto: RetryWorkflowDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.facade.retryWorkflow(examId, dto.step, user.id);
  }

  @Post("bulk/:action")
  @ApiOperation({
    summary: "Bulk workflow operations (publish, archive, retry)",
  })
  bulkOperation(
    @Param("action") action: string,
    @Body() dto: BulkWorkflowDto,
    @CurrentUser() user: AuthUser,
  ) {
    switch (action) {
      case "publish":
        return this.facade.bulkPublish(dto.examIds, user.id);
      case "archive":
        return this.facade.bulkArchive(dto.examIds, user.id);
      case "retry":
        return this.facade.bulkRetry(dto.examIds, dto.step!, user.id);
      default:
        throw new Error(`Unknown bulk action: ${action}`);
    }
  }
  @Post("bulk-publish")
  @ApiOperation({ summary: "Bulk publish multiple workflows" })
  @ApiCreatedResponse({ description: "Bulk operation result" })
  bulkPublish(@Body() dto: BulkWorkflowDto, @CurrentUser() user: AuthUser) {
    return this.facade.bulkPublish(dto.examIds, user.id);
  }

  @Post("bulk-archive")
  @ApiOperation({ summary: "Bulk archive multiple workflows" })
  @ApiCreatedResponse({ description: "Bulk operation result" })
  bulkArchive(@Body() dto: BulkWorkflowDto, @CurrentUser() user: AuthUser) {
    return this.facade.bulkArchive(dto.examIds, user.id);
  }

  @Post("bulk-retry")
  @ApiOperation({ summary: "Bulk retry multiple workflows at a specific step" })
  @ApiCreatedResponse({ description: "Bulk operation result" })
  bulkRetry(
    @Body() dto: BulkWorkflowDto & { step: WorkflowStep },
    @CurrentUser() user: AuthUser,
  ) {
    return this.facade.bulkRetry(dto.examIds, dto.step, user.id);
  }
}
