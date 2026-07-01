import { Injectable } from "@nestjs/common";
import { ReportAuditService } from "./report-audit.service";
import { AppLogger } from "@intervu-ai/shared-logger";

@Injectable()
export class JsonExportService {
  private readonly logger = new AppLogger({ name: "JsonExportService" });
  private readonly VERSION = "1.0.0";

  constructor(private readonly auditService: ReportAuditService) {}

  async generateJsonExport(attemptId: string, reportData: any): Promise<any> {
    this.logger.debug("Generating JSON report export for attempt", {
      attemptId,
    });

    const exportPayload = {
      metadata: {
        version: this.VERSION,
        exportedAt: new Date().toISOString(),
        attemptId,
        candidateEmail: reportData.candidate.email,
      },
      summary: {
        candidateName: reportData.candidate.fullName,
        assessmentTitle: reportData.assessment.title,
        overallScore: reportData.score,
        rank: reportData.rank,
        percentile: reportData.percentile,
        accuracy: reportData.accuracy,
        timeTakenSeconds: reportData.timeTaken,
      },
      analytics: {
        sectionBreakdown: reportData.sectionBreakdown,
        topicBreakdown: reportData.topicBreakdown,
        difficultyBreakdown: reportData.difficultyBreakdown,
        strengths: reportData.strengths,
        weaknesses: reportData.weaknesses,
        improvementPlan: reportData.improvementPlan,
      },
      recommendations: reportData.recommendations,
    };

    // Log JSON export audit event
    await this.auditService.logJsonExported(attemptId, {
      version: this.VERSION,
    });

    return exportPayload;
  }
}
