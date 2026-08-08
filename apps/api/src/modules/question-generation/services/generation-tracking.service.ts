import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  GenerationStrategy,
  QuestionGenerationJobStatus,
} from "@prisma/client";

@Injectable()
export class GenerationTrackingService {
  constructor(private readonly prisma: PrismaService) {}

  async createJob(
    templateId: string,
    totalCount: number,
    strategy: GenerationStrategy,
    context: any,
  ) {
    return this.prisma.questionGenerationJob.create({
      data: {
        templateId,
        totalCount,
        strategy,
        context,
        status: QuestionGenerationJobStatus.IN_PROGRESS,
      },
    });
  }

  async updateJobProgress(jobId: string, success: boolean) {
    return this.prisma.questionGenerationJob.update({
      where: { id: jobId },
      data: {
        successCount: success ? { increment: 1 } : undefined,
        failureCount: !success ? { increment: 1 } : undefined,
      },
    });
  }

  async completeJob(jobId: string, hasFailures: boolean) {
    return this.prisma.questionGenerationJob.update({
      where: { id: jobId },
      data: {
        status: hasFailures
          ? QuestionGenerationJobStatus.FAILED
          : QuestionGenerationJobStatus.COMPLETED,
      },
    });
  }

  async logEvent(
    templateId: string,
    level: string,
    event: string,
    metadata: any = {},
    jobId?: string,
  ) {
    return this.prisma.questionGenerationAuditLog.create({
      data: {
        templateId,
        jobId,
        level,
        event,
        metadata,
      },
    });
  }

  async getJobsByTemplate(templateId: string) {
    return this.prisma.questionGenerationJob.findMany({
      where: { templateId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { auditLogs: true },
        },
      },
    });
  }

  async getAuditLogsByJob(jobId: string) {
    return this.prisma.questionGenerationAuditLog.findMany({
      where: { jobId },
      orderBy: { createdAt: "asc" },
    });
  }
}
