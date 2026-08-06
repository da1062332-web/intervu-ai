import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { 
  Prisma, 
  ConfigStatus, 
  UserRole, 
  TestInstanceStatus 
} from "@prisma/client";
import { AdminPaginationQueryDto, AdminActivitiesQueryDto } from "../dto/admin-dashboard.dto";

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getTotalAssessments(): Promise<number> {
    return this.prisma.examConfig.count({
      where: { isArchived: false },
    });
  }

  async getActiveAssessments(): Promise<number> {
    return this.prisma.examConfig.count({
      where: {
        isArchived: false,
        OR: [
          { status: { in: [ConfigStatus.PUBLISHED, ConfigStatus.ACTIVE] } },
          { status: { notIn: [ConfigStatus.ARCHIVED, ConfigStatus.DRAFT] }, isActive: true },
        ],
      },
    });
  }

  async getTotalCandidates(): Promise<number> {
    return this.prisma.user.count({
      where: { role: UserRole.CANDIDATE },
    });
  }

  async getCompletedTests(): Promise<number> {
    return this.prisma.testInstance.count({
      where: { status: { in: [TestInstanceStatus.COMPLETED, TestInstanceStatus.SUBMITTED] } },
    });
  }

  async getAverageScore(): Promise<number> {
    const aggregate = await this.prisma.evaluationResult.aggregate({
      where: {
        testInstance: {
          status: { in: [TestInstanceStatus.COMPLETED, TestInstanceStatus.SUBMITTED] },
        },
      },
      _avg: { overallScore: true },
    });
    
    // Default to 0 if there are no evaluation results yet
    const avgScore = aggregate._avg.overallScore || 0;
    
    // Round to 2 decimal places
    return Math.round(avgScore * 100) / 100;
  }

  async getQuestionBankCount(): Promise<number> {
    const questions = await this.prisma.generatedQuestion.findMany({
      select: { metadata: true },
    });
    return questions.filter((q) => {
      const status = ((q.metadata as any)?.status || "GENERATED").toString().toUpperCase();
      return status === "APPROVED" || status === "PUBLISHED";
    }).length;
  }

  async getRecentAssessments(query: AdminPaginationQueryDto) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const where: Prisma.ExamConfigWhereInput = { isActive: true, isArchived: false };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.examConfig.count({ where }),
      this.prisma.examConfig.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const items = await Promise.all(
      data.map(async (config) => {
        const candidateCount = await this.prisma.testInstance.count({
          where: { examConfigId: config.id },
        });

        return {
          id: config.id,
          assessmentName: config.name || "Unknown Assessment",
          status: config.status || (config.isActive ? "PUBLISHED" : "DRAFT"),
          candidateCount,
          createdAt: config.createdAt.toISOString(),
        };
      })
    );

    return { data: items, total, page, limit };
  }

  async getRecentTestAttempts(query: AdminPaginationQueryDto) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const where: Prisma.TestInstanceWhereInput = {
      status: { in: [TestInstanceStatus.COMPLETED, TestInstanceStatus.SUBMITTED] },
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.testInstance.count({ where }),
      this.prisma.testInstance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { fullName: true, email: true },
          },
          examConfig: {
            select: { name: true },
          },
          testConfig: {
            select: { displayName: true },
          },
          evaluationResult: {
            select: { overallScore: true },
          },
        },
      }),
    ]);

    const items = data.map((attempt) => {
      const assessmentName = attempt.examConfig?.name || attempt.testConfig?.displayName || "Unknown Assessment";
      const candidateName = attempt.user?.fullName || attempt.user?.email || "Unknown Candidate";
      
      return {
        id: attempt.id,
        candidateName,
        email: attempt.user?.email || undefined,
        assessment: assessmentName,
        score: attempt.evaluationResult?.overallScore || 0,
        hasEvaluation: attempt.evaluationResult !== null,
        status: attempt.status,
        submittedAt: attempt.submittedAt?.toISOString() || attempt.updatedAt.toISOString(),
      };
    });

    return { data: items, total, page, limit };
  }

  async getRecentActivities(query: AdminActivitiesQueryDto) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const where: Prisma.AssessmentAuditLogWhereInput = {};

    if (query.type && query.type !== "all") {
      const typeLower = query.type.toLowerCase();
      if (typeLower === "assessment") {
        where.eventType = { in: ["ASSESSMENT_STARTED", "ASSESSMENT_SUBMITTED", "EVALUATION_COMPLETED", "CHECKPOINT", "RESUME", "TERMINATE"] };
      } else if (typeLower === "system") {
        where.eventType = { notIn: ["ASSESSMENT_STARTED", "ASSESSMENT_SUBMITTED", "EVALUATION_COMPLETED", "REPORT_VIEWED", "PROGRESS_VIEWED"] };
      } else if (typeLower === "user") {
        where.eventType = { in: ["REPORT_VIEWED", "PROGRESS_VIEWED", "USER"] };
      } else {
        where.eventType = { startsWith: query.type, mode: "insensitive" };
      }
    }

    if (query.search && query.search.trim() !== "") {
      const search = query.search.trim();
      where.OR = [
        { eventType: { contains: search, mode: "insensitive" } },
        {
          testInstance: {
            OR: [
              { user: { fullName: { contains: search, mode: "insensitive" } } },
              { user: { email: { contains: search, mode: "insensitive" } } },
              { examConfig: { name: { contains: search, mode: "insensitive" } } },
              { testConfig: { displayName: { contains: search, mode: "insensitive" } } },
            ],
          },
        },
      ];
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const orderBy = { createdAt: query.sortOrder === "asc" ? ("asc" as const) : ("desc" as const) };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.assessmentAuditLog.count({ where }),
      this.prisma.assessmentAuditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          testInstance: {
            include: {
              user: { select: { fullName: true, email: true } },
              examConfig: { select: { name: true } },
              testConfig: { select: { displayName: true } },
            },
          },
        },
      }),
    ]);

    const items = data.map((log) => {
      const attempt = log.testInstance;
      const candidateName = attempt?.user?.fullName || attempt?.user?.email || "Candidate";
      const assessmentName = attempt?.examConfig?.name || attempt?.testConfig?.displayName || "Assessment";
      
      let title = log.eventType;
      let description = `${candidateName} triggered ${log.eventType} on ${assessmentName}`;

      if (log.eventType === "ASSESSMENT_STARTED") {
        title = "Assessment Started";
        description = `${candidateName} started taking ${assessmentName}`;
      } else if (log.eventType === "ASSESSMENT_SUBMITTED") {
        title = "Assessment Submitted";
        description = `${candidateName} submitted ${assessmentName}`;
      } else if (log.eventType === "EVALUATION_COMPLETED") {
        title = "Evaluation Completed";
        description = `Evaluation was completed for ${candidateName}'s attempt of ${assessmentName}`;
      } else if (log.eventType === "REPORT_VIEWED") {
        title = "Report Viewed";
        description = `${candidateName} viewed report for ${assessmentName}`;
      } else if (log.eventType === "PROGRESS_VIEWED") {
        title = "Progress Viewed";
        description = `${candidateName} checked progress for ${assessmentName}`;
      } else if (log.eventType === "PDF_EXPORTED") {
        title = "PDF Exported";
        description = `PDF report exported for ${candidateName} on ${assessmentName}`;
      } else if (log.eventType === "JSON_EXPORTED") {
        title = "JSON Exported";
        description = `JSON data exported for ${candidateName} on ${assessmentName}`;
      }

      return {
        activityType: log.eventType,
        title,
        description,
        performedBy: candidateName,
        createdAt: log.createdAt.toISOString(),
      };
    });

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { data: items, total, page, limit, totalPages };
  }

  async getAssessmentCompletionRate() {
    const [completed, total] = await this.prisma.$transaction([
      this.prisma.testInstance.count({
        where: { status: { in: [TestInstanceStatus.COMPLETED, TestInstanceStatus.SUBMITTED] } },
      }),
      this.prisma.testInstance.count(),
    ]);

    const pending = total - completed;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      completionRate: Math.round(completionRate * 100) / 100, // Round to 2 decimal places
      completed,
      pending,
    };
  }
}
