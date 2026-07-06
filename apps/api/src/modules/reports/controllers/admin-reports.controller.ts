import { Controller, Get, Param, Query, UseGuards, Res } from "@nestjs/common";
import { Response } from "express";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { AdminReportService } from "../services/admin-report.service";
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";

@ApiTags("Admin Reports")
@ApiBearerAuth()
@Controller("admin/reports")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminReportsController {
  constructor(private readonly adminReportService: AdminReportService) {}

  @Get("assessment/:assessmentId")
  @ApiOperation({ summary: "Get aggregated assessment outcome report" })
  @ApiResponse({
    status: 200,
    description: "Successfully retrieved outcome report",
  })
  async getAssessmentOutcome(@Param("assessmentId") assessmentId: string) {
    return this.adminReportService.getAssessmentOutcome(assessmentId);
  }

  @Get("candidates")
  @ApiOperation({ summary: "Get candidate reports explorer data" })
  @ApiResponse({
    status: 200,
    description: "Successfully retrieved candidate reports",
  })
  async getCandidateReports(@Query() filters: any) {
    return this.adminReportService.getCandidateReports(filters);
  }

  @Get("exports/candidates")
  @ApiOperation({ summary: "Bulk export candidate reports as CSV" })
  @ApiResponse({
    status: 200,
    description: "Successfully exported candidate CSV",
  })
  async exportCandidatesCsv(@Query() filters: any, @Res() res: Response) {
    const csvContent =
      await this.adminReportService.exportCandidatesCsv(filters);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=candidates-export.csv",
    );
    res.send(csvContent);
  }
}
