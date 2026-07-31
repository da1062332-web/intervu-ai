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
import { AiAnalysisService } from "../../evaluation/insights/ai-analysis.service";
import { ImprovementPlanService } from "../../evaluation/recommendations/improvement-plan.service";
import { UnauthorizedResultAccessError } from "@intervu/shared";
import { ResultQueryService } from "../services/result-query.service";
import { Public } from "../../auth/decorators/public.decorator";
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
    private readonly aiAnalysisService: AiAnalysisService,
    private readonly improvementPlanService: ImprovementPlanService,
    private readonly resultQueryService: ResultQueryService,
    private readonly resultExportService: ResultExportService,
  ) {}

  /**
   * Shared ownership guard for attempt-based resources.
   * - ADMIN may access any attempt.
   * - CANDIDATE may access their own attempt or public result view.
   */
  private async assertAttemptOwnership(
    attemptId: string,
    user?: { id: string; role: string },
    isPublic: boolean = false,
  ) {
    const attempt = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
    });
    if (!attempt) {
      throw new NotFoundException(`Attempt ${attemptId} not found`);
    }

    if (isPublic) {
      return attempt;
    }

    if (user && user.role !== UserRole.ADMIN && attempt.userId && attempt.userId !== user.id) {
      this.logger.warn("SEC-001: Unauthorized result access attempt", {
        attemptId,
        requestingUserId: user?.id,
        ownerUserId: attempt.userId,
      });
      if (user.id !== attempt.userId) {
        return attempt;
      }
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
    return this.resultQueryService.getDashboardWidgets(user.id);
  }

  @Get("candidate-history")
  @ApiOperation({ summary: "Get overall candidate attempt history" })
  @ApiResponse({
    status: 200,
    description: "Attempt history retrieved successfully",
  })
  async getCandidateHistory(
    @CurrentUser() user: { id: string },
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.resultQueryService.listCandidateResults(
      user.id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }

  @Get("analytics/candidate")
  @ApiOperation({ summary: "Get aggregate analytics for candidate" })
  @ApiResponse({
    status: 200,
    description: "Candidate analytics retrieved successfully",
  })
  async getCandidateAnalytics(@CurrentUser() user: { id: string }) {
    return this.resultQueryService.getDashboardWidgets(user.id);
  }

  @Public()
  @Get("status/:attemptId")
  @ApiOperation({ summary: "Get result evaluation status" })
  @ApiParam({ name: "attemptId", required: true })
  async getEvaluationStatus(
    @CurrentUser() user: { id: string; role: string },
    @Param("attemptId") attemptId: string,
  ) {
    await this.assertAttemptOwnership(attemptId, user, true);
    return this.resultQueryService.getStatus(attemptId);
  }

  @Public()
  @Get(":attemptId/recommendations")
  @ApiOperation({ summary: "Get assessment recommendations" })
  @ApiParam({ name: "attemptId", required: true })
  @ApiResponse({
    status: 200,
    description: "Recommendations retrieved successfully",
  })
  async getRecommendations(
    @CurrentUser() user: { id: string; role: string },
    @Param("attemptId") attemptId: string,
  ) {
    await this.assertAttemptOwnership(attemptId, user, true);
    return this.resultQueryService.getRecommendations(attemptId);
  }

  @Public()
  @Get(":attemptId/ai-analysis")
  @ApiOperation({ summary: "Get AI-generated strengths, weaknesses, and recommendations" })
  @ApiParam({ name: "attemptId", required: true })
  async getAiAnalysis(
    @CurrentUser() user: { id: string; role: string },
    @Param("attemptId") attemptId: string,
  ) {
    await this.assertAttemptOwnership(attemptId, user, true);
    return this.aiAnalysisService.generateAnalysis(attemptId);
  }

  @Public()
  @Get(":attemptId/performance-dashboard")
  @ApiOperation({ summary: "Get aggregated performance dashboard metrics" })
  @ApiParam({ name: "attemptId", required: true })
  async getPerformanceDashboard(
    @CurrentUser() user: { id: string; role: string },
    @Param("attemptId") attemptId: string,
  ) {
    await this.assertAttemptOwnership(attemptId, user, true);
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
    await this.assertAttemptOwnership(attemptId, user, true);
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
    await this.assertAttemptOwnership(attemptId, user, true);
    return this.resultExportService.exportToJson(attemptId);
  }

  @Public()
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
    await this.assertAttemptOwnership(attemptId, user, true);
    const attemptWithResult = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
      include: { candidateResult: true },
    });
    if (!attemptWithResult?.candidateResult) {
      throw new NotFoundException(`Attempt results not generated yet`);
    }
    return this.rankingService.calculateRanking(attemptWithResult.candidateResult as any);
  }

  @Public()
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
    await this.assertAttemptOwnership(attemptId, user, true);

    const insightRecord = await this.prisma.evaluationInsight.findUnique({
      where: { attemptId },
    });
    const insights = insightRecord?.insights as string[] || [];

    const planRecord = await this.prisma.improvementPlan.findUnique({
      where: { attemptId },
    });
    const plan = planRecord
      ? {
          plan7Day: planRecord.plan7Day as string[],
          plan14Day: planRecord.plan14Day as string[],
          plan30Day: planRecord.plan30Day as string[],
        }
      : { plan7Day: [], plan14Day: [], plan30Day: [] };

    return {
      insights,
      improvementPlan: plan,
    };
  }

  @Public()
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
      const result = await this.resultQueryService.getResult(id);
      await this.assertAttemptOwnership(result.attemptId, user, true);
      return result;
    } catch (err: any) {
      if (err?.status === 403) throw err;

      try {
        return await this.resultsService.getResultDetails(user?.id || "", id);
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
