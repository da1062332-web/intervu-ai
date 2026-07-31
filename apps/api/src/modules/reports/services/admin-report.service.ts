import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { AppLogger } from "@intervu-ai/shared-logger";

@Injectable()
export class AdminReportService {
  private readonly logger = new AppLogger({ name: "AdminReportService" });

  constructor(private readonly prisma: PrismaService) {}

  private async resolveAssessmentConfig(id: string): Promise<{ configId: string; isExam: boolean; config: any }> {
    let config: any = await this.prisma.testConfig.findUnique({
      where: { id },
    });
    if (config) {
      return { configId: id, isExam: false, config };
    }

    config = await this.prisma.examConfig.findUnique({
      where: { id },
    });
    if (config) {
      return { configId: id, isExam: true, config };
    }

    const assembledTest = await this.prisma.assembledTest.findUnique({
      where: { id },
      include: { examConfig: true },
    });
    if (assembledTest && assembledTest.examConfig) {
      return { configId: assembledTest.configId, isExam: true, config: assembledTest.examConfig };
    }

    throw new NotFoundException(`Assessment ${id} not found`);
  }

  private async resolveConfigIdIfAssembled(id?: string): Promise<string | undefined> {
    if (!id) return undefined;
    const testConfig = await this.prisma.testConfig.findUnique({ where: { id }, select: { id: true } });
    if (testConfig) return id;
    const examConfig = await this.prisma.examConfig.findUnique({ where: { id }, select: { id: true } });
    if (examConfig) return id;
    const assembled = await this.prisma.assembledTest.findUnique({ where: { id }, select: { configId: true } });
    if (assembled) return assembled.configId;
    return id;
  }

  async getAssessmentOutcome(assessmentId: string) {
    this.logger.debug("Generating admin assessment outcome report", {
      assessmentId,
    });

    const { configId, isExam, config: assessment } = await this.resolveAssessmentConfig(assessmentId);

    const attempts = await this.prisma.evaluationResult.findMany({
      where: {
        testInstance: isExam
          ? { examConfigId: configId }
          : { testConfigId: configId },
      },
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
          title: assessment.displayName || assessment.name || "Unknown Assessment",
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
      where: isExam ? { examConfigId: configId } : { testConfigId: configId },
    });

    const completionRate =
      allInstances > 0 ? (completedCount / allInstances) * 100 : 0;
    const passRate = (passedCount / totalAttempts) * 100;
    const averageScore = totalScore / totalAttempts;

    return {
      assessment: {
        id: assessment.id,
        title: assessment.displayName || assessment.name || "Unknown Assessment",
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

    const andConditions: any[] = [{ evaluationResult: { isNot: null } }];

    if (filters.assessmentId) {
      const resolvedId = await this.resolveConfigIdIfAssembled(filters.assessmentId);
      andConditions.push({
        OR: [
          { testConfigId: resolvedId },
          { examConfigId: resolvedId },
        ],
      });
    }

    if (filters.search) {
      andConditions.push({
        OR: [
          { user: { fullName: { contains: filters.search, mode: "insensitive" } } },
          { user: { email: { contains: filters.search, mode: "insensitive" } } },
          { testConfig: { displayName: { contains: filters.search, mode: "insensitive" } } },
          { examConfig: { name: { contains: filters.search, mode: "insensitive" } } },
        ],
      });
    }

    const whereClause: any = { AND: andConditions };

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
        examConfig: { select: { id: true, name: true } },
        evaluationResult: true,
        candidateResult: true,
      },
      orderBy,
      take: filters.limit ? parseInt(filters.limit, 10) : 50,
      skip: filters.skip ? parseInt(filters.skip, 10) : 0,
    });

    const results = attempts.map((attempt: any) => {
      const cr = attempt.candidateResult;
      const score = attempt.evaluationResult?.overallScore || cr?.score || 0;
      const assessmentName = attempt.testConfig?.displayName || attempt.examConfig?.name || 'Unknown Assessment';
      const assessmentId = attempt.testConfig?.id || attempt.examConfig?.id || 'unknown';

      return {
        id: attempt.id,
        candidate: attempt.user,
        assessment: { id: assessmentId, displayName: assessmentName },
        score,
        evaluationStrategy: cr?.evaluationStrategy || "TCS",
        qualification: cr?.qualification || "NOT_SPECIFIED",
        qualificationReason: cr?.qualificationReason || "N/A",
        foundationScore: cr?.foundationScore ?? 0,
        advancedScore: cr?.advancedScore ?? 0,
        codingSolved: cr?.codingSolved ?? 0,
        completedAt: attempt.submittedAt || attempt.updatedAt,
      };
    });

    let filteredResults = results;
    if (filters.qualification && filters.qualification !== "ALL") {
      filteredResults = filteredResults.filter(
        (r) => r.qualification.toUpperCase() === filters.qualification.toUpperCase(),
      );
    }
    if (filters.strategy && filters.strategy !== "ALL") {
      filteredResults = filteredResults.filter(
        (r) => r.evaluationStrategy.toUpperCase() === filters.strategy.toUpperCase(),
      );
    }
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

  async getQualificationStats(assessmentId?: string) {
    const where: any = {};
    if (assessmentId) {
      const resolvedId = await this.resolveConfigIdIfAssembled(assessmentId);
      where.attempt = {
        OR: [
          { testConfigId: resolvedId },
          { examConfigId: resolvedId },
        ],
      };
    }

    const candidateResults = await (this.prisma as any).candidateResult.findMany({
      where,
      select: { qualification: true },
    });

    const totalCandidates = candidateResults.length;
    let primeCount = 0;
    let digitalCount = 0;
    let ninjaCount = 0;
    let notQualifiedCount = 0;

    candidateResults.forEach((cr: any) => {
      const q = (cr.qualification || "").toUpperCase();
      if (q === "PRIME") primeCount++;
      else if (q === "DIGITAL") digitalCount++;
      else if (q === "NINJA") ninjaCount++;
      else notQualifiedCount++;
    });

    const qualifiedTotal = primeCount + digitalCount + ninjaCount;
    const qualificationPercentage =
      totalCandidates > 0 ? Math.round((qualifiedTotal / totalCandidates) * 100) : 0;

    return {
      totalCandidates,
      primeCount,
      digitalCount,
      ninjaCount,
      notQualifiedCount,
      qualificationPercentage,
    };
  }

  async exportCandidatesCsv(filters: any): Promise<string> {
    this.logger.debug("Generating bulk candidate export CSV", { filters });
    const exportFilters = { ...filters, limit: filters.limit || 1000 };
    const reports = await this.getCandidateReports(exportFilters);

    if (reports.length === 0) {
      return "Candidate Name,Candidate Email,Assessment,Score,Strategy,Qualification,Reason,Foundation Score,Advanced Score,Coding Solved,Completed At\n";
    }

    const header =
      "Candidate Name,Candidate Email,Assessment,Score,Strategy,Qualification,Reason,Foundation Score,Advanced Score,Coding Solved,Completed At\n";
    const rows = reports.map((r) => {
      const name = `"${r.candidate?.fullName || "Candidate"}"`;
      const email = `"${r.candidate?.email || ""}"`;
      const assessment = `"${r.assessment?.displayName || ""}"`;
      const score = r.score;
      const strategy = `"${r.evaluationStrategy || "TCS"}"`;
      const qualification = `"${r.qualification || "NOT_SPECIFIED"}"`;
      const reason = `"${(r.qualificationReason || "").replace(/"/g, '""')}"`;
      const foundation = r.foundationScore ?? 0;
      const advanced = r.advancedScore ?? 0;
      const coding = r.codingSolved ?? 0;
      const completed = `"${new Date(r.completedAt).toISOString()}"`;
      return `${name},${email},${assessment},${score},${strategy},${qualification},${reason},${foundation},${advanced},${coding},${completed}`;
    });

    return header + rows.join("\n");
  }
}
