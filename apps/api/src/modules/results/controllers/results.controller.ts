import {
  Controller,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  NotFoundException,
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

@ApiTags("Results")
@ApiBearerAuth()
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
  ) {}

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
  async listCandidateResults(@Param("candidateId") candidateId: string) {
    return this.resultsService.listCandidateResults(candidateId);
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
      // Try to fetch CandidateResult (attempt ID) first
      return await this.resultsService.getCandidateResult(id);
    } catch {
      // Fallback to EvaluationResult details (Day 3 legacy path)
      return this.resultsService.getResultDetails(user.id, id);
    }
  }

  @Get(":evaluationId/recommendations")
  @ApiOperation({ summary: "Get evaluation recommendations" })
  @ApiParam({
    name: "evaluationId",
    required: true,
    description: "Evaluation ID",
  })
  @ApiResponse({
    status: 200,
    description: "Recommendations retrieved successfully",
  })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Forbidden" })
  @ApiNotFoundResponse({ description: "Result not found" })
  async getRecommendations(
    @CurrentUser() user: { id: string },
    @Param("evaluationId") evaluationId: string,
  ) {
    return this.recommendationsService.getRecommendations(
      user.id,
      evaluationId,
    );
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
  @ApiOperation({ summary: "Get candidate evaluation insights and improvement plans" })
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

    // Load or generate insights
    let insightRecord = await this.prisma.evaluationInsight.findUnique({
      where: { attemptId },
    });
    let insights = insightRecord?.insights as string[];
    if (!insights) {
      insights = await this.aiInsightService.generateInsights(attemptId);
    }

    // Load or generate plans
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
      const generated = await this.improvementPlanService.generatePlans(attemptId);
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
}
