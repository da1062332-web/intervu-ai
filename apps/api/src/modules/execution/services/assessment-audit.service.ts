import { Injectable, NotFoundException } from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class AssessmentAuditService {
  private readonly logger = new AppLogger({ name: "AssessmentAuditService" });

  constructor(private readonly prisma: PrismaService) {}

  async logEvent(
    attemptId: string,
    eventType: string,
    metadata?: any,
  ): Promise<any> {
    this.logger.debug("Logging assessment audit event", { attemptId, eventType });

    const attempt = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      this.logger.warn("Audit logging failed: attempt not found", { attemptId });
      return;
    }

    return this.prisma.assessmentAuditLog.create({
      data: {
        attemptId,
        candidateId: attempt.userId,
        assessmentId: attempt.testConfigId,
        eventType,
        metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  async getAuditTrail(attemptId: string): Promise<any[]> {
    this.logger.debug("Retrieving audit trail for attempt", { attemptId });

    // Validate that attempt exists
    const attemptExists = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
    });

    if (!attemptExists) {
      throw new NotFoundException({
        code: "ASSESSMENT_NOT_FOUND",
        message: "Assessment attempt not found",
      });
    }

    return this.prisma.assessmentAuditLog.findMany({
      where: { attemptId },
      orderBy: { createdAt: "asc" },
    });
  }
}
