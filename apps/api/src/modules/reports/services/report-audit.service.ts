import { Injectable } from "@nestjs/common";
import { AssessmentAuditService } from "../../execution/services/assessment-audit.service";
import { PrismaService } from "@/prisma/prisma.service";
import { AppLogger } from "@intervu-ai/shared-logger";

@Injectable()
export class ReportAuditService {
  private readonly logger = new AppLogger({ name: "ReportAuditService" });

  constructor(
    private readonly auditService: AssessmentAuditService,
    private readonly prisma: PrismaService,
  ) {}

  async logReportViewed(attemptId: string): Promise<void> {
    this.logger.debug("Logging report viewed audit event", { attemptId });
    await this.auditService.logEvent(attemptId, "REPORT_VIEWED");
  }

  async logPdfExported(attemptId: string, metadata?: any): Promise<void> {
    this.logger.debug("Logging PDF exported audit event", { attemptId });
    await this.auditService.logEvent(attemptId, "PDF_EXPORTED", metadata);
  }

  async logJsonExported(attemptId: string, metadata?: any): Promise<void> {
    this.logger.debug("Logging JSON exported audit event", { attemptId });
    await this.auditService.logEvent(attemptId, "JSON_EXPORTED", metadata);
  }

  async logProgressViewed(userId: string): Promise<void> {
    this.logger.debug("Logging progress viewed audit event", { userId });
    const latestAttempt = await this.prisma.testInstance.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    if (latestAttempt) {
      await this.auditService.logEvent(latestAttempt.id, "PROGRESS_VIEWED");
    }
  }
}
