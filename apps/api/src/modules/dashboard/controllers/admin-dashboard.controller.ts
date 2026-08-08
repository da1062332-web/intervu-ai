import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from "@nestjs/swagger";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { AdminDashboardService } from "../services/admin-dashboard.service";
import {
  AdminPaginationQueryDto,
  AdminActivitiesQueryDto,
  TotalAssessmentsDto,
  ActiveAssessmentsDto,
  TotalCandidatesDto,
  CompletedTestsDto,
  AverageScoreDto,
  QuestionBankCountDto,
  AssessmentCompletionRateDto,
  RecentAssessmentsResponseDto,
  RecentTestAttemptsResponseDto,
  RecentActivitiesResponseDto,
} from "../dto/admin-dashboard.dto";

@ApiTags("Admin Dashboard")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/dashboard")
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get("total-assessments")
  @ApiOperation({
    summary: "Get total number of assessments (published & unpublished)",
  })
  @ApiOkResponse({ type: TotalAssessmentsDto })
  @ApiUnauthorizedResponse({
    description: "Invalid or missing JWT bearer token",
  })
  @ApiForbiddenResponse({ description: "Forbidden - Requires ADMIN role" })
  async getTotalAssessments(): Promise<TotalAssessmentsDto> {
    const totalAssessments =
      await this.adminDashboardService.getTotalAssessments();
    return { totalAssessments };
  }

  @Get("active-assessments")
  @ApiOperation({ summary: "Get number of active (published) assessments" })
  @ApiOkResponse({ type: ActiveAssessmentsDto })
  async getActiveAssessments(): Promise<ActiveAssessmentsDto> {
    const activeAssessments =
      await this.adminDashboardService.getActiveAssessments();
    return { activeAssessments };
  }

  @Get("total-candidates")
  @ApiOperation({ summary: "Get total number of candidates" })
  @ApiOkResponse({ type: TotalCandidatesDto })
  async getTotalCandidates(): Promise<TotalCandidatesDto> {
    const totalCandidates =
      await this.adminDashboardService.getTotalCandidates();
    return { totalCandidates };
  }

  @Get("completed-tests")
  @ApiOperation({
    summary: "Get total number of completed or submitted test attempts",
  })
  @ApiOkResponse({ type: CompletedTestsDto })
  async getCompletedTests(): Promise<CompletedTestsDto> {
    const completedTests = await this.adminDashboardService.getCompletedTests();
    return { completedTests };
  }

  @Get("average-score")
  @ApiOperation({ summary: "Get average overall score across all evaluations" })
  @ApiOkResponse({ type: AverageScoreDto })
  async getAverageScore(): Promise<AverageScoreDto> {
    const averageScore = await this.adminDashboardService.getAverageScore();
    return { averageScore };
  }

  @Get("question-bank-count")
  @ApiOperation({
    summary: "Get total number of questions in the bank (excluding archived)",
  })
  @ApiOkResponse({ type: QuestionBankCountDto })
  async getQuestionBankCount(): Promise<QuestionBankCountDto> {
    const questionBankCount =
      await this.adminDashboardService.getQuestionBankCount();
    return { questionBankCount };
  }

  @Get("recent-assessments")
  @ApiOperation({
    summary: "Get paginated list of recent assembled assessments",
  })
  @ApiOkResponse({ type: RecentAssessmentsResponseDto })
  async getRecentAssessments(
    @Query() query: AdminPaginationQueryDto,
  ): Promise<RecentAssessmentsResponseDto> {
    return this.adminDashboardService.getRecentAssessments(query);
  }

  @Get("recent-test-attempts")
  @ApiOperation({
    summary: "Get paginated list of recent candidate test attempts",
  })
  @ApiOkResponse({ type: RecentTestAttemptsResponseDto })
  async getRecentTestAttempts(
    @Query() query: AdminPaginationQueryDto,
  ): Promise<RecentTestAttemptsResponseDto> {
    return this.adminDashboardService.getRecentTestAttempts(query);
  }

  @Get("recent-activities")
  @ApiOperation({
    summary: "Get paginated list of recent assessment activities",
  })
  @ApiOkResponse({ type: RecentActivitiesResponseDto })
  async getRecentActivities(
    @Query() query: AdminActivitiesQueryDto,
  ): Promise<RecentActivitiesResponseDto> {
    return this.adminDashboardService.getRecentActivities(query);
  }

  @Get("assessment-completion-rate")
  @ApiOperation({
    summary:
      "Get assessment completion rate (completed vs total eligible attempts)",
  })
  @ApiOkResponse({ type: AssessmentCompletionRateDto })
  async getAssessmentCompletionRate(): Promise<AssessmentCompletionRateDto> {
    return this.adminDashboardService.getAssessmentCompletionRate();
  }
}
