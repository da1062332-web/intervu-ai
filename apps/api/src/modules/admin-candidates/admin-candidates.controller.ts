import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { AdminCandidatesService } from "./admin-candidates.service";
import {
  CandidateListQueryDto,
  CandidateListResponseDto,
  CandidateDetailsResponseDto,
  CandidateStatsResponseDto,
  CandidateTestHistoryQueryDto,
  CandidateTestHistoryResponseDto,
} from "./dto/admin-candidates.dto";

@ApiTags("Admin Candidates")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("admin/candidates")
export class AdminCandidatesController {
  constructor(private readonly adminCandidatesService: AdminCandidatesService) {}

  @Get()
  @ApiOperation({ summary: "Retrieve paginated list of candidates with summary stats" })
  @ApiQuery({ name: "page", required: false, type: Number, description: "Page number (default: 1)" })
  @ApiQuery({ name: "limit", required: false, type: Number, description: "Items per page (default: 10)" })
  @ApiQuery({ name: "search", required: false, type: String, description: "Search by name or email" })
  @ApiQuery({ name: "status", required: false, enum: ["ACTIVE", "INACTIVE"], description: "Filter by account status" })
  @ApiQuery({ name: "sortBy", required: false, type: String, description: "Sort attribute (name, email, averageScore, bestScore, createdAt)" })
  @ApiQuery({ name: "sortOrder", required: false, enum: ["asc", "desc"], description: "Sort direction" })
  @ApiOkResponse({ type: CandidateListResponseDto, description: "Candidate list retrieved successfully" })
  @ApiBadRequestResponse({ description: "Invalid Request" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Forbidden - Requires ADMIN role" })
  async getCandidateList(
    @Query() query: CandidateListQueryDto,
  ): Promise<CandidateListResponseDto> {
    return this.adminCandidatesService.getCandidateList(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Retrieve detailed profile information for a specific candidate" })
  @ApiParam({ name: "id", required: true, description: "Candidate User ID" })
  @ApiOkResponse({ type: CandidateDetailsResponseDto, description: "Candidate details retrieved successfully" })
  @ApiBadRequestResponse({ description: "Invalid Request" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Forbidden - Requires ADMIN role" })
  @ApiNotFoundResponse({ description: "Candidate Not Found" })
  async getCandidateDetails(
    @Param("id") id: string,
  ): Promise<CandidateDetailsResponseDto> {
    return this.adminCandidatesService.getCandidateDetails(id);
  }

  @Get(":id/stats")
  @ApiOperation({ summary: "Retrieve aggregated test and evaluation metrics for a candidate" })
  @ApiParam({ name: "id", required: true, description: "Candidate User ID" })
  @ApiOkResponse({ type: CandidateStatsResponseDto, description: "Candidate statistics retrieved successfully" })
  @ApiBadRequestResponse({ description: "Invalid Request" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Forbidden - Requires ADMIN role" })
  @ApiNotFoundResponse({ description: "Candidate Not Found" })
  async getCandidateStats(
    @Param("id") id: string,
  ): Promise<CandidateStatsResponseDto> {
    return this.adminCandidatesService.getCandidateStats(id);
  }

  @Get(":id/tests")
  @ApiOperation({ summary: "Retrieve paginated test attempt history for a candidate" })
  @ApiParam({ name: "id", required: true, description: "Candidate User ID" })
  @ApiQuery({ name: "page", required: false, type: Number, description: "Page number (default: 1)" })
  @ApiQuery({ name: "limit", required: false, type: Number, description: "Items per page (default: 10)" })
  @ApiOkResponse({ type: CandidateTestHistoryResponseDto, description: "Candidate test history retrieved successfully" })
  @ApiBadRequestResponse({ description: "Invalid Request" })
  @ApiUnauthorizedResponse({ description: "Unauthorized" })
  @ApiForbiddenResponse({ description: "Forbidden - Requires ADMIN role" })
  @ApiNotFoundResponse({ description: "Candidate Not Found" })
  async getCandidateTestHistory(
    @Param("id") id: string,
    @Query() query: CandidateTestHistoryQueryDto,
  ): Promise<CandidateTestHistoryResponseDto> {
    return this.adminCandidatesService.getCandidateTestHistory(id, query);
  }
}
