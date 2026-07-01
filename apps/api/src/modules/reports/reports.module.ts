import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { ResultsModule } from "../results/results.module";
import { ExecutionModule } from "../execution/execution.module";
import { ReportsController } from "./controllers/reports.controller";
import {
  CandidateReportService,
  CandidateProgressService,
  PdfReportService,
  JsonExportService,
  ReportAuditService,
} from "./services";

@Module({
  imports: [PrismaModule, ResultsModule, ExecutionModule],
  controllers: [ReportsController],
  providers: [
    CandidateReportService,
    CandidateProgressService,
    PdfReportService,
    JsonExportService,
    ReportAuditService,
  ],
  exports: [
    CandidateReportService,
    CandidateProgressService,
    PdfReportService,
    JsonExportService,
    ReportAuditService,
  ],
})
export class ReportsModule {}
