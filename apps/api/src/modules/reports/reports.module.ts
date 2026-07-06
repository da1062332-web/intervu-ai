import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { ResultsModule } from "../results/results.module";
import { ExecutionModule } from "../execution/execution.module";
import { ReportsController } from "./controllers/reports.controller";
import { AdminReportsController } from "./controllers/admin-reports.controller";
import {
  CandidateReportService,
  CandidateProgressService,
  PdfReportService,
  JsonExportService,
  ReportAuditService,
  AdminReportService,
} from "./services";

@Module({
  imports: [PrismaModule, ResultsModule, ExecutionModule],
  controllers: [ReportsController, AdminReportsController],
  providers: [
    CandidateReportService,
    CandidateProgressService,
    PdfReportService,
    JsonExportService,
    ReportAuditService,
    AdminReportService,
  ],
  exports: [
    CandidateReportService,
    CandidateProgressService,
    PdfReportService,
    JsonExportService,
    ReportAuditService,
    AdminReportService,
  ],
})
export class ReportsModule {}
