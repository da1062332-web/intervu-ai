import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";
import { EnrollmentService } from "../services/enrollment.service";
import {
  EnrollRequestDto,
  EnrollmentListResponseDto,
  EnrollResponseDto,
} from "../dto/enroll.dto";
import { ValidateResponse } from "@intervu/shared";

@ApiTags("candidate-enrollments")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CANDIDATE)
@Controller("candidate/enrollments")
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post()
  @ApiOperation({ summary: "Enroll in a test" })
  @ApiOkResponse({ type: EnrollResponseDto })
  async enroll(
    @CurrentUser() user: AuthUser,
    @Body() dto: EnrollRequestDto,
  ): Promise<EnrollResponseDto> {
    return this.enrollmentService.enroll(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "List candidate enrollments" })
  @ApiOkResponse({ type: EnrollmentListResponseDto })
  async getEnrollments(
    @CurrentUser() user: AuthUser,
  ): Promise<EnrollmentListResponseDto> {
    return this.enrollmentService.getEnrollments(user.id);
  }
}
