import {
  Controller,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
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
}
