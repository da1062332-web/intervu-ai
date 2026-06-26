import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

export interface AuditLogEntry {
  id: string;
  module: "GENERATION" | "VALIDATION" | "REVIEW" | "EXECUTION";
  action: string;
  status: string;
  message: string;
  createdAt: Date;
  metadata?: unknown;
}

export interface GetAuditLogsDto {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  module?: "GENERATION" | "VALIDATION" | "REVIEW" | "EXECUTION";
}

export interface PaginatedAuditLogs {
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class PlatformAuditService {
  private readonly logger = new Logger(PlatformAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAuditLogs(dto: GetAuditLogsDto): Promise<PaginatedAuditLogs> {
    const page = Number(dto.page) || 1;
    const limit = Number(dto.limit) || 10;
    const skip = (page - 1) * limit;

    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (dto.startDate) {
      dateFilter.gte = new Date(dto.startDate);
    }
    if (dto.endDate) {
      dateFilter.lte = new Date(dto.endDate);
    }

    const hasDateFilters = Object.keys(dateFilter).length > 0;

    let entries: AuditLogEntry[] = [];
    let totalCount = 0;

    const targetModule = dto.module;

    const queries: Promise<void>[] = [];

    if (!targetModule || targetModule === "GENERATION") {
      queries.push(
        this.prisma.generationLog
          .findMany({
            where: hasDateFilters ? { createdAt: dateFilter } : {},
            orderBy: { createdAt: "desc" },
            take: skip + limit,
          })
          .then((logs) => {
            const mapped = logs.map(
              (l): AuditLogEntry => ({
                id: l.id,
                module: "GENERATION",
                action: l.step,
                status: l.status,
                message: l.message,
                createdAt: l.createdAt,
                metadata: l.metadata,
              }),
            );
            entries = entries.concat(mapped);
          }),
      );
      queries.push(
        this.prisma.generationLog
          .count({
            where: hasDateFilters ? { createdAt: dateFilter } : {},
          })
          .then((c) => {
            totalCount += c;
          }),
      );
    }

    if (!targetModule || targetModule === "VALIDATION") {
      queries.push(
        this.prisma.validationLog
          .findMany({
            where: hasDateFilters ? { createdAt: dateFilter } : {},
            orderBy: { createdAt: "desc" },
            take: skip + limit,
          })
          .then((logs) => {
            const mapped = logs.map(
              (l): AuditLogEntry => ({
                id: l.id,
                module: "VALIDATION",
                action: l.validationStage,
                status: l.isValid ? "VALID" : "INVALID",
                message: l.failureReason || "Validation passed",
                createdAt: l.createdAt,
                metadata: l.metadata,
              }),
            );
            entries = entries.concat(mapped);
          }),
      );
      queries.push(
        this.prisma.validationLog
          .count({
            where: hasDateFilters ? { createdAt: dateFilter } : {},
          })
          .then((c) => {
            totalCount += c;
          }),
      );
    }

    if (!targetModule || targetModule === "REVIEW") {
      queries.push(
        this.prisma.questionReview
          .findMany({
            where: hasDateFilters ? { createdAt: dateFilter } : {},
            orderBy: { createdAt: "desc" },
            take: skip + limit,
          })
          .then((logs) => {
            const mapped = logs.map(
              (l): AuditLogEntry => ({
                id: l.id,
                module: "REVIEW",
                action: "REVIEW_DECISION",
                status: l.status,
                message: l.notes || "No notes provided",
                createdAt: l.createdAt,
                metadata: { questionId: l.questionId },
              }),
            );
            entries = entries.concat(mapped);
          }),
      );
      queries.push(
        this.prisma.questionReview
          .count({
            where: hasDateFilters ? { createdAt: dateFilter } : {},
          })
          .then((c) => {
            totalCount += c;
          }),
      );
    }

    if (!targetModule || targetModule === "EXECUTION") {
      queries.push(
        this.prisma.submission
          .findMany({
            where: hasDateFilters ? { createdAt: dateFilter } : {},
            orderBy: { createdAt: "desc" },
            take: skip + limit,
          })
          .then((submissions) => {
            const mapped = submissions.map(
              (s): AuditLogEntry => ({
                id: s.id,
                module: "EXECUTION",
                action: "SUBMIT",
                status: s.status,
                message: s.submissionHash || "Attempt submitted",
                createdAt: s.createdAt,
                metadata: { testInstanceId: s.testInstanceId },
              }),
            );
            entries = entries.concat(mapped);
          }),
      );
      queries.push(
        this.prisma.submission
          .count({
            where: hasDateFilters ? { createdAt: dateFilter } : {},
          })
          .then((c) => {
            totalCount += c;
          }),
      );
    }

    await Promise.all(queries);

    entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const paginatedItems = entries.slice(skip, skip + limit);

    return {
      items: paginatedItems,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }
}
