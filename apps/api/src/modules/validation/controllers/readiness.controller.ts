import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { ReadinessEngineService } from "../services/readiness-engine.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { ValidateResponse } from "@intervu/shared";
import { ReadinessReportResponseSchema } from "@intervu-ai/contracts";

@ApiTags("readiness")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@Controller("configs")
export class ReadinessController {
  constructor(private readonly readinessService: ReadinessEngineService) {}

  @Post(":id/readiness")
  @HttpCode(HttpStatus.CREATED)
  @ValidateResponse(ReadinessReportResponseSchema)
  @ApiOperation({ summary: "Generate a readiness report for an exam config" })
  @ApiParam({ name: "id", description: "Exam configuration ID" })
  @ApiCreatedResponse({
    description: "Readiness report generated successfully",
  })
  async generateReport(@Param("id") id: string) {
    const result = await this.readinessService.generateReport(id);
    return {
      score: result.score,
      status: result.status,
      checks:
        ((result.report as Record<string, unknown>)?.checks as unknown[]) || [],
      report: (result.report as Record<string, unknown>)?.report || {},
    };
  }

  @Get(":id/readiness")
  @HttpCode(HttpStatus.OK)
  @ValidateResponse(ReadinessReportResponseSchema)
  @ApiOperation({ summary: "Fetch latest readiness report for an exam config" })
  @ApiParam({ name: "id", description: "Exam configuration ID" })
  @ApiOkResponse({ description: "Latest readiness report details" })
  async getReport(@Param("id") id: string) {
    const result = await this.readinessService.getLatestReport(id);
    return {
      score: result.score,
      status: result.status,
      checks:
        ((result.report as Record<string, unknown>)?.checks as unknown[]) || [],
      report: (result.report as Record<string, unknown>)?.report || {},
    };
  }
}
