import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Delete,
  Patch,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiParam,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

import { QuestionBankService } from "../services/question-bank.service";
import { QuestionSearchService } from "../services/question-search.service";
import { QuestionVersionService } from "../services/question-version.service";
import { QuestionReviewService } from "../services/question-review.service";
import { QuestionSimilarityService } from "../services/question-similarity.service";
import { QuestionReservationService } from "../services/question-reservation.service";
import { QuestionRotationService } from "../services/question-rotation.service";
 
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  BulkUploadDto,
  SearchFiltersDto,
  CheckDuplicateDto,
  ApproveRejectDto,
} from "../dto/question-bank.dto";
 
import {
  AssemblyProviderRequestDto,
  ReleaseReservationsDto,
} from "../dto/assembly-provider.dto";

@ApiTags("Question Bank")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("question-bank")
export class QuestionBankController {
  constructor(
    private readonly bankService: QuestionBankService,
    private readonly searchService: QuestionSearchService,
    private readonly versionService: QuestionVersionService,
    private readonly reviewService: QuestionReviewService,
    private readonly similarityService: QuestionSimilarityService,
    private readonly reservationService: QuestionReservationService,
    private readonly rotationService: QuestionRotationService,
  ) {}

  @Post("bulk")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Bulk persist questions into the pool" })
  @ApiCreatedResponse({ description: "Questions saved successfully" })
  async bulkUpload(@Body() dto: BulkUploadDto) {
    const result = await this.bankService.createBulkQuestions(dto);
    return {
      success: true,
      data: result,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get("search")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Filtered and paginated search of the question pool",
  })
  @ApiOkResponse({ description: "Search results returned successfully" })
  async search(@Query() filters: SearchFiltersDto) {
    const result = await this.searchService.search(filters);
    return {
      success: true,
      data: result,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get("stats")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Retrieve statistics and metrics of the question pool",
  })
  @ApiOkResponse({ description: "Stats retrieved successfully" })
  async stats(
    @Query("topicId") topicId?: string,
    @Query("sectionId") sectionId?: string,
  ) {
    const result = await this.bankService.getStats({ topicId, sectionId });
    return {
      success: true,
      data: result,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post("check-duplicate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Checks if a question is semantically duplicate" })
  @ApiOkResponse({ description: "Similarity check completed" })
  async checkDuplicate(@Body() dto: CheckDuplicateDto) {
    const result = await this.similarityService.checkDuplicate(
      dto.questionText,
      dto.topicId,
      dto.sectionId,
    );
    return {
      success: true,
      data: result,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get(":id/versions")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Retrieve version and snapshot history for a question",
  })
  @ApiParam({ name: "id", description: "Question ID" })
  @ApiOkResponse({ description: "Versions retrieved successfully" })
  async getVersions(@Param("id") id: string) {
    const result = await this.versionService.getVersions(id);
    return {
      success: true,
      data: result,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post(":id/version")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a manual version snapshot of the question" })
  @ApiParam({ name: "id", description: "Question ID" })
  @ApiCreatedResponse({ description: "Snapshot created successfully" })
  async createManualSnapshot(@Param("id") id: string) {
    // In update logic, snapshot is done automatically.
    // For manual versioning, we fetch the question and execute snapshot.
    const result = await this.bankService.updateQuestion(id, {});
    return {
      success: true,
      data: result,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post(":id/approve")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Approve a VALIDATED question to ACTIVE" })
  @ApiParam({ name: "id", description: "Question ID" })
  async approve(@Param("id") id: string, @Body() dto: ApproveRejectDto) {
    const result = await this.reviewService.approveQuestion(id, dto.notes);
    return {
      success: true,
      data: result,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post(":id/reject")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reject a question back to DRAFT status" })
  @ApiParam({ name: "id", description: "Question ID" })
  async reject(@Param("id") id: string, @Body() dto: ApproveRejectDto) {
    const result = await this.reviewService.rejectQuestion(id, dto.notes);
    return {
      success: true,
      data: result,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post(":id/restore")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Restore an ARCHIVED question back to DRAFT status",
  })
  @ApiParam({ name: "id", description: "Question ID" })
  async restore(@Param("id") id: string) {
    const result = await this.bankService.restoreQuestion(id);
    return {
      success: true,
      data: result,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a single question" })
  async create(@Body() dto: CreateQuestionDto) {
    const result = await this.bankService.createQuestion(dto);
    return {
      success: true,
      data: result,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update question details" })
  async update(@Param("id") id: string, @Body() dto: UpdateQuestionDto) {
    const result = await this.bankService.updateQuestion(id, dto);
    return {
      success: true,
      data: result,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Soft delete / Archive a question" })
  async delete(@Param("id") id: string) {
    const result = await this.bankService.archiveQuestion(id);
    return {
      success: true,
      data: result,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post("provider")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Retrieve and reserve questions for test assembly" })
  async provider(@Body() dto: AssemblyProviderRequestDto) {
    const result = await this.rotationService.retrieveAndReserve(dto);
    return {
      success: true,
      data: result,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post("availability")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Check question pool availability for a blueprint" })
  async availability(@Body() dto: AssemblyProviderRequestDto) {
    const result = await this.rotationService.checkAvailability(dto);
    return {
      success: true,
      data: result,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get("health")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Retrieve rotation and pool health metrics" })
  async health() {
    const result = await this.rotationService.getPoolHealth();
    return {
      success: true,
      data: result,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post("reservations/release")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Explicitly release reservations for an assembly ID",
  })
  async releaseReservations(@Body() dto: ReleaseReservationsDto) {
    const count = await this.reservationService.releaseReservations(
      dto.assemblyId,
    );
    return {
      success: true,
      data: { releasedCount: count },
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post("reservations/cleanup")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Clean up all expired reservations from the database",
  })
  async cleanupReservations() {
    const count = await this.reservationService.cleanupExpiredReservations();
    return {
      success: true,
      data: { cleanedCount: count },
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
