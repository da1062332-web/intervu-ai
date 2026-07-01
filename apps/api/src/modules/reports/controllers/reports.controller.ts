import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Res,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { Response } from "express";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { AuthUser } from "../../auth/interfaces/auth-user.interface";
import { PrismaService } from "@/prisma/prisma.service";
import {
  CandidateReportService,
  CandidateProgressService,
  PdfReportService,
  JsonExportService,
} from "../services";
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";

@ApiTags("Reports")
@ApiBearerAuth()
@Controller("reports")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reportService: CandidateReportService,
    private readonly progressService: CandidateProgressService,
    private readonly pdfService: PdfReportService,
    private readonly jsonService: JsonExportService,
  ) {}

  private async validateAccess(
    user: AuthUser,
    attemptId: string,
  ): Promise<any> {
    const attempt = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException(`Assessment attempt ${attemptId} not found`);
    }

    if (user.role !== "ADMIN" && attempt.userId !== user.id) {
      throw new ForbiddenException(
        "Access Denied: You do not have permission to access this report.",
      );
    }

    return attempt;
  }

  @Get("candidate/:attemptId")
  @ApiOperation({ summary: "Get detailed candidate assessment report" })
  @ApiResponse({ status: 200, description: "Successfully generated report" })
  async getCandidateReport(
    @Param("attemptId") attemptId: string,
    @CurrentUser() user: AuthUser,
  ) {
    const attempt = await this.validateAccess(user, attemptId);
    return this.reportService.getCandidateReport(attempt.userId, attemptId);
  }

  @Get("progress")
  @ApiOperation({ summary: "Get candidate historical progress analytics" })
  @ApiResponse({
    status: 200,
    description: "Successfully aggregated progress analytics",
  })
  async getCandidateProgress(
    @CurrentUser() user: AuthUser,
    @Query("userId") queryUserId?: string,
  ) {
    const targetUserId =
      user.role === "ADMIN" && queryUserId ? queryUserId : user.id;
    return this.progressService.getCandidateProgress(targetUserId);
  }

  @Get("export/pdf/:attemptId")
  @ApiOperation({ summary: "Export candidate assessment report as PDF" })
  @ApiResponse({ status: 200, description: "Successfully exported PDF" })
  async exportPdf(
    @Param("attemptId") attemptId: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const attempt = await this.validateAccess(user, attemptId);
    const reportData = await this.reportService.getCandidateReport(
      attempt.userId,
      attemptId,
    );
    const pdfBuffer = await this.pdfService.generatePdfReport(
      attemptId,
      reportData,
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=report-${attemptId}.pdf`,
    );
    res.send(pdfBuffer);
  }

  @Get("export/json/:attemptId")
  @ApiOperation({ summary: "Export candidate assessment report as JSON" })
  @ApiResponse({ status: 200, description: "Successfully exported JSON file" })
  async exportJson(
    @Param("attemptId") attemptId: string,
    @CurrentUser() user: AuthUser,
    @Res() res: Response,
  ) {
    const attempt = await this.validateAccess(user, attemptId);
    const reportData = await this.reportService.getCandidateReport(
      attempt.userId,
      attemptId,
    );
    const jsonExport = await this.jsonService.generateJsonExport(
      attemptId,
      reportData,
    );

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=report-${attemptId}.json`,
    );
    res.send(jsonExport);
  }
}
