import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("assessments")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("assessments")
export class AssessmentsController {
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create assessment directly with rich parameters" })
  @ApiCreatedResponse({ description: "Assessment created successfully" })
  async createAssessment(
    @Body()
    body: {
      companyId?: string;
      testType?: string;
      title?: string;
      description?: string;
      duration?: number;
      examConfigId?: string;
      passingScore?: number;
      startDate?: string;
      endDate?: string;
    },
  ) {
    return {
      success: true,
      data: {
        testId: `test_${Date.now()}`,
        companyId: body.companyId || "comp_default",
        examConfigId: body.examConfigId || null,
        title: body.title || "Assessment",
        description: body.description || null,
        duration: body.duration || 60,
        passingScore: body.passingScore || 70,
        status: "CREATED",
        startDate: body.startDate || new Date().toISOString(),
        endDate: body.endDate || null,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
