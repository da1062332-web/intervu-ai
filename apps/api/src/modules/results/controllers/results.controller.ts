import {
  Controller,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  NotFoundException,
  Query,
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

@ApiTags("Results")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
@Roles(UserRole.ADMIN, UserRole.CANDIDATE)
@Controller("results")
export class ResultsController {
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

  @Get("dashboard")
  @ApiOperation({ summary: "Get candidate dashboard widgets" })
  @ApiResponse({
    status: 200,
    description: "Dashboard widgets retrieved successfully",
  })
  async getDashboardWidgets(@CurrentUser() user: { id: string }) {
    return this.resultQueryService.getDashboardWidgets(user.id);
  }

  @Get("latest")
  @ApiOperation({ summary: "Get latest result for the candidate" })
  @ApiResponse({
    status: 200,
    description: "Latest result retrieved successfully",
  })
  async getLatestResult(@CurrentUser() user: { id: string }) {
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
    @Param("candidateId") candidateId: string,
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "10",
  ) {
    return this.resultQueryService.listCandidateResults(
      candidateId,
      Number(page) || 1,
      Number(limit) || 10,
    );
  }

  @Get("status/:attemptId")
  @ApiOperation({ summary: "Get status of the assessment result generation" })
  @ApiParam({ name: "attemptId", required: true })
  @ApiResponse({ status: 200, description: "Status retrieved successfully" })
  async getResultStatus(@Param("attemptId") attemptId: string) {
    return this.resultQueryService.getStatus(attemptId);
  }

  @Get(":attemptId/analytics")
  @ApiOperation({ summary: "Get performance analytics for an attempt" })
  @ApiParam({ name: "attemptId", required: true })
  @ApiResponse({ status: 200, description: "Analytics retrieved successfully" })
  async getAnalytics(@Param("attemptId") attemptId: string) {
    return this.resultQueryService.getAnalytics(attemptId);
  }

  @Get(":attemptId/analysis")
  @ApiOperation({ summary: "Get strength and weakness analysis" })
  @ApiParam({ name: "attemptId", required: true })
  @ApiResponse({ status: 200, description: "Analysis retrieved successfully" })
  async getAnalysis(@Param("attemptId") attemptId: string) {
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
  async getRecommendations(@Param("attemptId") attemptId: string) {
    // Calling our new result-query recommendations mapping
    return this.resultQueryService.getRecommendations(attemptId);
  }

  @Get(":attemptId/performance-dashboard")
  @ApiOperation({ summary: "Get aggregated performance dashboard metrics" })
  @ApiParam({ name: "attemptId", required: true })
  async getPerformanceDashboard(@Param("attemptId") attemptId: string) {
    return this.resultQueryService.getPerformanceDashboard(attemptId);
  }

  @Get(":attemptId/export/pdf")
  @ApiOperation({ summary: "Export result to PDF" })
  @ApiParam({ name: "attemptId", required: true })
  async exportToPdf(@Param("attemptId") attemptId: string) {
    return this.resultExportService.exportToPdf(attemptId);
  }

  @Get(":attemptId/export/json")
  @ApiOperation({ summary: "Export result to JSON" })
  @ApiParam({ name: "attemptId", required: true })
  async exportToJson(@Param("attemptId") attemptId: string) {
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
    const attempt = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
      include: { candidateResult: true },
    });
    if (!attempt) {
      throw new NotFoundException(`Attempt ${attemptId} not found`);
    }
    if (user.role !== UserRole.ADMIN && attempt.userId !== user.id) {
      throw new UnauthorizedResultAccessError();
    }
    if (!attempt.candidateResult) {
      throw new NotFoundException(`Attempt results not generated yet`);
    }
    return this.rankingService.calculateRanking(attempt.candidateResult as any);
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
    const attempt = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
    });
    if (!attempt) {
      throw new NotFoundException(`Attempt ${attemptId} not found`);
    }
    if (user.role !== UserRole.ADMIN && attempt.userId !== user.id) {
      throw new UnauthorizedResultAccessError();
    }

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
    @CurrentUser() user: { id: string },
    @Param("id") id: string,
  ) {
    try {
      // First try our new getResult which returns the tailored response
      return await this.resultQueryService.getResult(id);
    } catch {
      // Fallback to legacy implementation (if evaluating ID is used, or candidateResult is missing but evaluationResult exists)
      try {
        return await this.resultsService.getCandidateResult(id);
      } catch {
        try {
          return await this.resultsService.getResultDetails(user.id, id);
        } catch (error: any) {
          if (error?.name === 'ResultNotFoundError' || error?.constructor?.name === 'ResultNotFoundError') {
            throw new NotFoundException(`Result not found for id ${id}`);
          }
          throw error;
        }
      }
    }
  }
}
