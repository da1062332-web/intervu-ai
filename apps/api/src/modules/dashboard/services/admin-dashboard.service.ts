import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { 
  Prisma, 
  AssemblyStatus, 
  UserRole, 
  TestInstanceStatus, 
  QuestionStatus 
} from "@prisma/client";
import { AdminPaginationQueryDto } from "../dto/admin-dashboard.dto";

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getTotalAssessments(): Promise<number> {
    return this.prisma.assembledTest.count();
  }

  async getActiveAssessments(): Promise<number> {
    return this.prisma.assembledTest.count({
      where: { status: AssemblyStatus.PUBLISHED },
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
      _avg: { overallScore: true },
    });
    
    // Default to 0 if there are no evaluation results yet
    const avgScore = aggregate._avg.overallScore || 0;
    
    // Round to 2 decimal places
    return Math.round(avgScore * 100) / 100;
  }

  async getQuestionBankCount(): Promise<number> {
    return this.prisma.question.count({
      where: { status: { not: QuestionStatus.ARCHIVED } },
    });
  }

  async getRecentAssessments(query: AdminPaginationQueryDto) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const [total, data] = await this.prisma.$transaction([
      this.prisma.assembledTest.count(),
      this.prisma.assembledTest.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          examConfig: {
            select: { name: true },
          },
        },
      }),
    ]);

    // To get candidate counts per assembled test, we count test instances linked to the config
    // Note: Since TestInstance links to testConfigId or examConfigId, we use examConfigId.
    const items = await Promise.all(
      data.map(async (test) => {
        const candidateCount = await this.prisma.testInstance.count({
          where: { examConfigId: test.configId },
        });

        return {
          id: test.id,
          assessmentName: test.examConfig?.name || "Unknown Assessment",
          status: test.status,
          candidateCount,
          createdAt: test.createdAt.toISOString(),
        };
      })
    );

    return { data: items, total, page, limit };
  }

  async getRecentTestAttempts(query: AdminPaginationQueryDto) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const [total, data] = await this.prisma.$transaction([
      this.prisma.testInstance.count(),
      this.prisma.testInstance.findMany({
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
        candidateName,
        assessment: assessmentName,
        score: attempt.evaluationResult?.overallScore || 0,
        status: attempt.status,
        submittedAt: attempt.submittedAt?.toISOString() || attempt.updatedAt.toISOString(),
      };
    });

    return { data: items, total, page, limit };
  }

  async getRecentActivities(query: AdminPaginationQueryDto) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const [total, data] = await this.prisma.$transaction([
      this.prisma.assessmentAuditLog.count(),
      this.prisma.assessmentAuditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          testInstance: {
            include: {
              user: { select: { fullName: true, email: true } },
              examConfig: { select: { name: true } },
              testConfig: { select: { displayName: true } }
            }
          }
        }
      }),
    ]);

    const items = data.map((log) => {
      const attempt = log.testInstance;
      const candidateName = attempt?.user?.fullName || attempt?.user?.email || "Candidate";
      const assessmentName = attempt?.examConfig?.name || attempt?.testConfig?.displayName || "Assessment";
      
      let title = log.eventType;
      let description = `${candidateName} triggered ${log.eventType} on ${assessmentName}`;

      // Improve title and description based on common event types if known
      if (log.eventType === "ASSESSMENT_STARTED") {
        title = "Assessment Started";
        description = `${candidateName} started taking ${assessmentName}`;
      } else if (log.eventType === "ASSESSMENT_SUBMITTED") {
        title = "Assessment Submitted";
        description = `${candidateName} submitted ${assessmentName}`;
      } else if (log.eventType === "EVALUATION_COMPLETED") {
        title = "Evaluation Completed";
        description = `Evaluation was completed for ${candidateName}'s attempt of ${assessmentName}`;
      }

      return {
        activityType: log.eventType,
        title,
        description,
        performedBy: candidateName,
        createdAt: log.createdAt.toISOString(),
      };
    });

    return { data: items, total, page, limit };
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
