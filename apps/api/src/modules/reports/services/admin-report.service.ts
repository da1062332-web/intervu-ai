import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { AppLogger } from "@intervu-ai/shared-logger";

@Injectable()
export class AdminReportService {
  private readonly logger = new AppLogger({ name: "AdminReportService" });

  constructor(private readonly prisma: PrismaService) {}

  async getAssessmentOutcome(assessmentId: string) {
    this.logger.debug("Generating admin assessment outcome report", {
      assessmentId,
    });

    const assessment = await this.prisma.testConfig.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment ${assessmentId} not found`);
    }

    const attempts = await this.prisma.evaluationResult.findMany({
      where: { testInstance: { testConfigId: assessmentId } },
      include: {
        testInstance: {
          select: {
            status: true,
          },
        },
        skillScores: true,
      },
    });

    const totalAttempts = attempts.length;
    if (totalAttempts === 0) {
      return {
        assessment: {
          id: assessment.id,
          title: assessment.displayName,
        },
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passRate: 0,
        completionRate: 0,
        topicPerformance: [],
      };
    }

    let totalScore = 0;
    let highestScore = 0;
    let lowestScore = 100;
    let passedCount = 0;
    let completedCount = 0;

    const topicScores: Record<string, { total: number; count: number }> = {};

    attempts.forEach((attempt) => {
      const score = attempt.overallScore;
      totalScore += score;
      if (score > highestScore) highestScore = score;
      if (score < lowestScore) lowestScore = score;
      if (score >= 60) passedCount++; // Assuming 60 is pass
      if (
        attempt.testInstance?.status === "COMPLETED" ||
        attempt.testInstance?.status === "SUBMITTED"
      )
        completedCount++;

      attempt.skillScores.forEach((skill) => {
        if (!topicScores[skill.skill]) {
          topicScores[skill.skill] = { total: 0, count: 0 };
        }
        topicScores[skill.skill].total += skill.score;
        topicScores[skill.skill].count += 1;
      });
    });

    const topicPerformance = Object.entries(topicScores).map(
      ([topic, data]) => ({
        topic,
        averageScore: data.total / data.count,
      }),
    );

    // Find total enrollments or started instances to calculate completion rate properly
    const allInstances = await this.prisma.testInstance.count({
      where: { testConfigId: assessmentId },
    });

    const completionRate =
      allInstances > 0 ? (completedCount / allInstances) * 100 : 0;
    const passRate = (passedCount / totalAttempts) * 100;
    const averageScore = totalScore / totalAttempts;

    return {
      assessment: {
        id: assessment.id,
        title: assessment.displayName,
      },
      averageScore,
      highestScore,
      lowestScore: lowestScore === 100 && totalAttempts > 0 ? 0 : lowestScore,
      passRate,
      completionRate,
      topicPerformance,
    };
  }

  async getCandidateReports(filters: any) {
    this.logger.debug("Fetching candidate reports with filters", { filters });

    const whereClause: any = {};
    if (filters.assessmentId) {
      whereClause.testConfigId = filters.assessmentId;
    }

    whereClause.evaluationResult = { isNot: null };

    if (filters.search) {
      whereClause.OR = [
        {
          user: { fullName: { contains: filters.search, mode: "insensitive" } },
        },
        { user: { email: { contains: filters.search, mode: "insensitive" } } },
        {
          testConfig: {
            displayName: { contains: filters.search, mode: "insensitive" },
          },
        },
      ];
    }

    let orderBy: any = { createdAt: "desc" };
    if (filters.sortBy) {
      const order = filters.sortOrder === "asc" ? "asc" : "desc";
      if (filters.sortBy === "score") {
        orderBy = { evaluationResult: { overallScore: order } };
      } else if (filters.sortBy === "candidate") {
        orderBy = { user: { fullName: order } };
      } else if (filters.sortBy === "assessment") {
        orderBy = { testConfig: { displayName: order } };
      } else if (filters.sortBy === "completedAt") {
        orderBy = { submittedAt: order };
      }
    }

    const attempts = await this.prisma.testInstance.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        testConfig: { select: { id: true, displayName: true } },
        evaluationResult: true,
      },
      orderBy,
      take: filters.limit ? parseInt(filters.limit, 10) : 50,
      skip: filters.skip ? parseInt(filters.skip, 10) : 0,
    });

    const results = attempts.map((attempt) => {
      const score = attempt.evaluationResult?.overallScore || 0;
      return {
        id: attempt.id,
        candidate: attempt.user,
        assessment: attempt.testConfig,
        score,
        completedAt: attempt.submittedAt || attempt.updatedAt,
      };
    });

    let filteredResults = results;
    if (filters.minScore !== undefined) {
      filteredResults = filteredResults.filter(
        (r) => r.score >= parseFloat(filters.minScore),
      );
    }
    if (filters.maxScore !== undefined) {
      filteredResults = filteredResults.filter(
        (r) => r.score <= parseFloat(filters.maxScore),
      );
    }
    return filteredResults;
  }

  async exportCandidatesCsv(filters: any): Promise<string> {
    this.logger.debug("Generating bulk candidate export CSV", { filters });
    // Increase limit for bulk export if not provided
    const exportFilters = { ...filters, limit: filters.limit || 1000 };
    const reports = await this.getCandidateReports(exportFilters);

    if (reports.length === 0) {
      return "Candidate Name,Candidate Email,Assessment,Score,Completed At\n";
    }

    const header =
      "Candidate Name,Candidate Email,Assessment,Score,Completed At\n";
    const rows = reports.map((r) => {
      const name = `"${r.candidate?.fullName || "Candidate"}"`;
      const email = `"${r.candidate?.email || ""}"`;
      const assessment = `"${r.assessment?.displayName || ""}"`;
      const score = r.score;
      const completed = `"${new Date(r.completedAt).toISOString()}"`;
      return `${name},${email},${assessment},${score},${completed}`;
    });

    return header + rows.join("\n");
  }
}
