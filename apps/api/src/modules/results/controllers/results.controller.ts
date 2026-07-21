import {
  Controller,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  NotFoundException,
  ForbiddenException,
  Query,
  Res,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { ResponseInterceptor } from "@intervu/shared";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { ResultsService } from "../services/results.service";
import { RecommendationsService } from "../services/recommendations.service";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { CandidateRankingService } from "../../evaluation/ranking/candidate-ranking.service";
import { AiInsightService } from "../../evaluation/insights/ai-insight.service";
import { ImprovementPlanService } from "../../evaluation/recommendations/improvement-plan.service";
import { UnauthorizedResultAccessError } from "@intervu/shared";
import { ResultQueryService } from "../services/result-query.service";
import { ResultExportService } from "../services/result-export.service";
import { AppLogger } from "@intervu-ai/shared-logger";

@ApiTags("Results")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
@Roles(UserRole.ADMIN, UserRole.CANDIDATE)
@Controller("results")
export class ResultsController {
  private readonly logger = new AppLogger({ name: "ResultsController" });

  constructor(
    private readonly resultsService: ResultsService,
    private readonly recommendationsService: RecommendationsService,
    private readonly prisma: PrismaService,
    private readonly rankingService: CandidateRankingService,
    private readonly aiInsightService: AiInsightService,
    private readonly improvementPlanService: ImprovementPlanService,
    private readonly resultQueryService: ResultQueryService,
    private readonly resultExportService: ResultExportService,
  ) {}

  /**
   * Shared ownership guard for attempt-based resources.
   * - ADMIN may access any attempt.
   * - CANDIDATE may only access their own attempt.
   * Returns the TestInstance so callers can use it directly.
   */
  private async assertAttemptOwnership(
    attemptId: string,
    user: { id: string; role: string },
  ) {
    const attempt = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
    });
    if (!attempt) {
      throw new NotFoundException(`Attempt ${attemptId} not found`);
    }
    if (user.role !== UserRole.ADMIN && attempt.userId !== user.id) {
      this.logger.warn("SEC-001: Unauthorized result access attempt", {
        attemptId,
        requestingUserId: user.id,
        ownerUserId: attempt.userId,
      });
      throw new ForbiddenException(
        "You do not have permission to access this result",
      );
    }
    return attempt;
  }

  @Get("dashboard")
  @ApiOperation({ summary: "Get candidate dashboard widgets" })
  @ApiResponse({
    status: 200,
    description: "Dashboard widgets retrieved successfully",
  })
  async getDashboardWidgets(@CurrentUser() user: { id: string }) {
    // Always scoped to authenticated user — no ownership issue
    return this.resultQueryService.getDashboardWidgets(user.id);
  }

  @Get("latest")
  @ApiOperation({ summary: "Get latest result for the candidate" })
  @ApiResponse({
    status: 200,
    description: "Latest result retrieved successfully",
  })
  async getLatestResult(@CurrentUser() user: { id: string }) {
    // Always scoped to authenticated user — no ownership issue
    return this.resultQueryService.getLatestResult(user.id);
  }

  @Get("candidate/:candidateId")
  @ApiOperation({ summary: "List assessment results for a specific candidate" })
  @ApiParam({
    name: "candidateId",
    required: true,
    description: "Candidate ID",
  })
  @ApiResponse({
    status: 200,
    description: "Candidate results retrieved successfully",
  })
  async listCandidateResults(
    @CurrentUser() user: { id: string; role: string },
    @Param("candidateId") candidateId: string,
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "10",
  ) {
    // SEC-001: Candidates can only query their own results
    // Admin can query any candidate's results
    const resolvedCandidateId =
      user.role === UserRole.ADMIN ? candidateId : user.id;

    if (user.role !== UserRole.ADMIN && candidateId !== user.id) {
      this.logger.warn("SEC-001: Candidate attempted to access another candidate's results list", {
        requestingUserId: user.id,
        requestedCandidateId: candidateId,
      });
      throw new ForbiddenException(
        "You may only access your own results",
      );
    }

    return this.resultQueryService.listCandidateResults(
      resolvedCandidateId,
      Number(page) || 1,
      Number(limit) || 10,
    );
  }

  @Get("status/:attemptId")
  @ApiOperation({ summary: "Get status of the assessment result generation" })
  @ApiParam({ name: "attemptId", required: true })
  @ApiResponse({ status: 200, description: "Status retrieved successfully" })
  async getResultStatus(
    @CurrentUser() user: { id: string; role: string },
    @Param("attemptId") attemptId: string,
  ) {
    // SEC-001: Enforce ownership
    await this.assertAttemptOwnership(attemptId, user);
    return this.resultQueryService.getStatus(attemptId);
  }

  @Get(":attemptId/analytics")
  @ApiOperation({ summary: "Get performance analytics for an attempt" })
  @ApiParam({ name: "attemptId", required: true })
  @ApiResponse({ status: 200, description: "Analytics retrieved successfully" })
  async getAnalytics(
    @CurrentUser() user: { id: string; role: string },
    @Param("attemptId") attemptId: string,
  ) {
    // SEC-001: Enforce ownership
    await this.assertAttemptOwnership(attemptId, user);
    return this.resultQueryService.getAnalytics(attemptId);
  }

  @Get(":attemptId/analysis")
  @ApiOperation({ summary: "Get strength and weakness analysis" })
  @ApiParam({ name: "attemptId", required: true })
  @ApiResponse({ status: 200, description: "Analysis retrieved successfully" })
  async getAnalysis(
    @CurrentUser() user: { id: string; role: string },
    @Param("attemptId") attemptId: string,
  ) {
    // SEC-001: Enforce ownership
    await this.assertAttemptOwnership(attemptId, user);
    return this.resultQueryService.getAnalysis(attemptId);
  }

  @Get(":attemptId/recommendations")
  @ApiOperation({ summary: "Get evaluation recommendations" })
  @ApiParam({
    name: "attemptId",
    required: true,
    description: "Test attempt ID",
  })
  @ApiResponse({
    status: 200,
    description: "Recommendations retrieved successfully",
  })
  async getRecommendations(
    @CurrentUser() user: { id: string; role: string },
    @Param("attemptId") attemptId: string,
  ) {
    // SEC-001: Enforce ownership
    await this.assertAttemptOwnership(attemptId, user);
    return this.resultQueryService.getRecommendations(attemptId);
  }

  @Get(":attemptId/performance-dashboard")
  @ApiOperation({ summary: "Get aggregated performance dashboard metrics" })
  @ApiParam({ name: "attemptId", required: true })
  async getPerformanceDashboard(
    @CurrentUser() user: { id: string; role: string },
    @Param("attemptId") attemptId: string,
  ) {
    // SEC-001: Enforce ownership
    await this.assertAttemptOwnership(attemptId, user);
    return this.resultQueryService.getPerformanceDashboard(attemptId);
  }

  @Get(":attemptId/export/pdf")
  @ApiOperation({ summary: "Export result to PDF" })
  @ApiParam({ name: "attemptId", required: true })
  async exportToPdf(
    @CurrentUser() user: { id: string; role: string },
    @Param("attemptId") attemptId: string,
    @Res() res: import("express").Response,
  ) {
    // SEC-001: Enforce ownership before generating PDF
    await this.assertAttemptOwnership(attemptId, user);
    const pdfBuffer = await this.resultExportService.exportToPdf(attemptId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=report-${attemptId}.pdf`,
    );
    res.end(pdfBuffer);
  }

  @Get(":attemptId/export/json")
  @ApiOperation({ summary: "Export result to JSON" })
  @ApiParam({ name: "attemptId", required: true })
  async exportToJson(
    @CurrentUser() user: { id: string; role: string },
    @Param("attemptId") attemptId: string,
  ) {
    // SEC-001: Enforce ownership before exporting JSON
    await this.assertAttemptOwnership(attemptId, user);
    return this.resultExportService.exportToJson(attemptId);
  }

  @Get(":attemptId/rank")
  @ApiOperation({ summary: "Get candidate ranking details" })
  @ApiParam({
    name: "attemptId",
    required: true,
    description: "Test attempt ID",
  })
  async getCandidateRank(
    @CurrentUser() user: { id: string; role: string },
    @Param("attemptId") attemptId: string,
  ) {
    // Ownership already checked via assertAttemptOwnership
    const attempt = await this.assertAttemptOwnership(attemptId, user);
    const attemptWithResult = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
      include: { candidateResult: true },
    });
    if (!attemptWithResult?.candidateResult) {
      throw new NotFoundException(`Attempt results not generated yet`);
    }
    return this.rankingService.calculateRanking(attemptWithResult.candidateResult as any);
  }

  @Get(":attemptId/insights")
  @ApiOperation({
    summary: "Get candidate evaluation insights and improvement plans",
  })
  @ApiParam({
    name: "attemptId",
    required: true,
    description: "Test attempt ID",
  })
  async getCandidateInsights(
    @CurrentUser() user: { id: string; role: string },
    @Param("attemptId") attemptId: string,
  ) {
    // Ownership is checked via assertAttemptOwnership (already replaces the direct check)
    await this.assertAttemptOwnership(attemptId, user);

    let insightRecord = await this.prisma.evaluationInsight.findUnique({
      where: { attemptId },
    });
    let insights = insightRecord?.insights as string[];
    if (!insights) {
      insights = await this.aiInsightService.generateInsights(attemptId);
    }

    let planRecord = await this.prisma.improvementPlan.findUnique({
      where: { attemptId },
    });
    let plan = planRecord
      ? {
          plan7Day: planRecord.plan7Day as string[],
          plan14Day: planRecord.plan14Day as string[],
          plan30Day: planRecord.plan30Day as string[],
        }
      : null;
    if (!plan) {
      const generated =
        await this.improvementPlanService.generatePlans(attemptId);
      plan = {
        plan7Day: generated.plan7Day,
        plan14Day: generated.plan14Day,
        plan30Day: generated.plan30Day,
      };
    }

    return {
      insights,
      improvementPlan: plan,
    };
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get assessment result details by attempt ID or evaluation ID",
  })
  @ApiParam({
    name: "id",
    required: true,
    description: "Test attempt ID or evaluation ID",
  })
  @ApiResponse({
    status: 200,
    description: "Result details retrieved successfully",
  })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  @ApiNotFoundResponse({ description: "Result not found" })
  async getResultDetails(
    @CurrentUser() user: { id: string; role: string },
    @Param("id") id: string,
  ) {
    try {
      // First try our new getResult which returns the tailored response
      // SEC-001: Pass user so ownership can be checked inside
      const result = await this.resultQueryService.getResult(id);

      // Verify ownership: look up the testInstance for the attemptId
      await this.assertAttemptOwnership(result.attemptId, user);
      return result;
    } catch (err: any) {
      // If it was a ForbiddenException from assertAttemptOwnership, re-throw
      if (err?.status === 403) throw err;

      // Fallback to legacy implementation
      try {
        return await this.resultsService.getResultDetails(user.id, id);
      } catch (error: any) {
        if (
          error?.name === "ResultNotFoundError" ||
          error?.constructor?.name === "ResultNotFoundError"
        ) {
          throw new NotFoundException(`Result not found for id ${id}`);
        }
        throw error;
      }
    }
  }
}
