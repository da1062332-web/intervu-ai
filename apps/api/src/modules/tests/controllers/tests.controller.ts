import { Controller, Get, Query, UseGuards, Optional } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";

import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { TestsService } from "../services/tests.service";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";
import { EnrollmentService } from "../../candidate/services/enrollment.service";
import { AttemptHistoryService } from "../../candidate/services/attempt-history.service";

import { TestConfigsResponseDto } from "../dto/available-config.dto";

@ApiTags("tests")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.CANDIDATE)
@Controller("tests")
export class TestsController {
  constructor(
    private readonly testsService: TestsService,
    @Optional() private readonly enrollmentService?: EnrollmentService,
    @Optional() private readonly attemptHistoryService?: AttemptHistoryService,
  ) {}

  @Get("configs")
  @ApiOperation({
    summary: "Discover available test configurations",
    description:
      "Returns all active assessment templates that a candidate can start.",
  })
  @ApiOkResponse({ type: TestConfigsResponseDto })
  async getAvailableConfigs(): Promise<TestConfigsResponseDto> {
    return this.testsService.getAvailableConfigs();
  }

  @Get("assigned")
  @ApiOperation({ summary: "Get candidate's assigned / enrolled assessments" })
  @ApiOkResponse({ description: "Assigned assessments retrieved successfully" })
  async getAssignedTests(
    @CurrentUser() user: AuthUser,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    if (this.enrollmentService) {
      const enrollmentsData = await this.enrollmentService.getEnrollments(
        user.id,
      );
      return {
        success: true,
        data: enrollmentsData,
        meta: {
          total: enrollmentsData.enrollments.length,
          page: pageNum,
          limit: limitNum,
          totalPages:
            Math.ceil(enrollmentsData.enrollments.length / limitNum) || 1,
          timestamp: new Date().toISOString(),
        },
      };
    }

    return {
      success: true,
      data: { enrollments: [] },
      meta: {
        total: 0,
        page: pageNum,
        limit: limitNum,
        totalPages: 0,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get("history")
  @ApiOperation({
    summary: "Get candidate's attempt history with rich metrics",
  })
  @ApiOkResponse({ description: "Attempt history retrieved successfully" })
  async getAttemptHistory(
    @CurrentUser() user: AuthUser,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    if (this.attemptHistoryService) {
      const historyData = await this.attemptHistoryService.getAttemptHistory(
        user.id,
        pageNum,
        limitNum,
      );
      return {
        success: true,
        data: historyData,
        meta: {
          total: historyData.pagination.total,
          page: historyData.pagination.page,
          limit: historyData.pagination.limit,
          totalPages: historyData.pagination.totalPages,
          timestamp: new Date().toISOString(),
        },
      };
    }

    return {
      success: true,
      data: { attempts: [] },
      meta: {
        total: 0,
        page: pageNum,
        limit: limitNum,
        totalPages: 0,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
