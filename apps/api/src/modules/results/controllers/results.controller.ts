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

  @Get(":evaluationId")
  @ApiOperation({ summary: "Get evaluation result details" })
  @ApiParam({
    name: "evaluationId",
    required: true,
    description: "Evaluation ID",
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
    @Param("evaluationId") evaluationId: string,
  ) {
    return this.resultsService.getResultDetails(user.id, evaluationId);
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
