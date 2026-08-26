import { Injectable, NotFoundException } from "@nestjs/common";
import { AppLogger } from "@intervu-ai/shared-logger";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma } from "@prisma/client";

interface CachedAttemptMeta {
  userId: string;
  assessmentId: string;
  cachedAt: number;
}

@Injectable()
export class AssessmentAuditService {
  private readonly logger = new AppLogger({ name: "AssessmentAuditService" });
  private readonly attemptCache = new Map<string, CachedAttemptMeta>();

  constructor(private readonly prisma: PrismaService) {}

  private async getAttemptMeta(
    attemptId: string,
  ): Promise<{ userId: string; assessmentId: string } | null> {
    const cached = this.attemptCache.get(attemptId);
    if (cached && Date.now() - cached.cachedAt < 600000) {
      // 10 minutes cache
      return { userId: cached.userId, assessmentId: cached.assessmentId };
    }

    try {
      const attempt = await this.prisma.testInstance.findUnique({
        where: { id: attemptId },
        select: {
          id: true,
          userId: true,
          testConfigId: true,
        },
      });

      if (attempt) {
        const meta = {
          userId: attempt.userId,
          assessmentId:
            attempt.testConfigId || (attempt as any).examConfigId || "unknown",
          cachedAt: Date.now(),
        };
        this.attemptCache.set(attemptId, meta);
        return { userId: meta.userId, assessmentId: meta.assessmentId };
      }
    } catch (err: any) {
      this.logger.warn("Transient error reading attempt meta for audit log", {
        attemptId,
        error: err?.message,
      });
    }

    return null;
  }

  async logEvent(
    attemptId: string,
    eventType: string,
    metadata?: any,
  ): Promise<any> {
    try {
      this.logger.debug("Logging assessment audit event", {
        attemptId,
        eventType,
      });

      const meta = await this.getAttemptMeta(attemptId);
      if (!meta) {
        this.logger.warn("Audit logging skipped: attempt metadata unavailable", {
          attemptId,
          eventType,
        });
        return;
      }

      return await this.prisma.assessmentAuditLog.create({
        data: {
          attemptId,
          candidateId: meta.userId,
          assessmentId: meta.assessmentId,
          eventType,
          metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
        },
      });
    } catch (err: any) {
      // Resilient catch: Never allow audit logging failure to crash candidate execution flows
      this.logger.warn("Non-fatal error creating assessment audit log record", {
        attemptId,
        eventType,
        error: err?.message,
      });
      return null;
    }
  }

  async getAuditTrail(attemptId: string): Promise<any[]> {
    this.logger.debug("Retrieving audit trail for attempt", { attemptId });

    try {
      return await this.prisma.assessmentAuditLog.findMany({
        where: { attemptId },
        orderBy: { createdAt: "asc" },
      });
    } catch (err: any) {
      this.logger.error("Failed to retrieve audit trail", {
        attemptId,
        error: err?.message,
      });
      return [];
    }
  }
}
