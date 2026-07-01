import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { ResultsService } from "../../results/services/results.service";
import { AppLogger } from "@intervu-ai/shared-logger";
import { ReportAuditService } from "./report-audit.service";

@Injectable()
export class CandidateReportService {
  private readonly logger = new AppLogger({ name: "CandidateReportService" });

  constructor(
    private readonly prisma: PrismaService,
    private readonly resultsService: ResultsService,
    private readonly auditService: ReportAuditService,
  ) {}

  async getCandidateReport(userId: string, attemptId: string): Promise<any> {
    this.logger.debug("Generating candidate report", { attemptId, userId });

    // 1. Fetch the TestInstance and user details
    const attempt = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
      include: {
        user: true,
        testConfig: true,
        candidateAnswers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Assessment attempt ${attemptId} not found`);
    }

    // 2. Fetch the EvaluationResult and associated models
    const evaluation = await this.prisma.evaluationResult.findUnique({
      where: { testInstanceId: attemptId },
      include: {
        skillScores: true,
        recommendations: true,
      },
    });

    if (!evaluation) {
      throw new NotFoundException(
        `Evaluation for attempt ${attemptId} has not been completed yet`,
      );
    }

    // 3. Reuse ResultsService to calculate breakdown details
    const resultDetails = await this.resultsService.getResultDetails(
      attempt.userId,
      attemptId,
    );

    // 4. Calculate Rank and Percentile dynamically
    const testConfigId = attempt.testConfigId;
    const allAttempts = await this.prisma.evaluationResult.findMany({
      where: {
        testInstance: {
          testConfigId,
        },
      },
      select: {
        overallScore: true,
      },
    });

    const totalAttemptsCount = allAttempts.length;
    const score = evaluation.overallScore;

    // Rank is the number of attempts with score higher than candidate + 1
    const countHigher = allAttempts.filter(
      (a) => a.overallScore > score,
    ).length;
    const rank = countHigher + 1;

    // Percentile = ((Total - Rank) / (Total - 1)) * 100
    const percentile =
      totalAttemptsCount > 1
        ? Math.round(
            ((totalAttemptsCount - rank) / (totalAttemptsCount - 1)) * 100,
          )
        : 100;

    // 5. Derive strengths and weaknesses from skill scores
    const skillScores = evaluation.skillScores || [];
    const strengths = skillScores
      .filter((s) => s.score >= 70 || (s.score >= 7 && s.score <= 10))
      .map((s) => s.skill);

    const weaknesses = skillScores
      .filter((s) => s.score < 60 || (s.score < 6 && s.score <= 10))
      .map((s) => s.skill);

    // 6. Generate dynamic improvement plan based on weaknesses
    const improvementPlan = this.generateImprovementPlan(
      weaknesses,
      evaluation.recommendations,
    );

    // 7. Log audit trail event
    await this.auditService.logReportViewed(attemptId);

    return {
      candidate: {
        fullName: attempt.user.fullName || "Candidate",
        email: attempt.user.email,
      },
      assessment: {
        id: attempt.testConfigId,
        title: attempt.testConfig.displayName,
        totalDurationSeconds: attempt.testConfig.totalDurationSeconds,
      },
      score,
      rank,
      percentile,
      accuracy: resultDetails.accuracy,
      timeTaken: resultDetails.timeAnalysis.totalTimeSpentSeconds,
      sectionBreakdown: resultDetails.sectionScores,
      topicBreakdown: resultDetails.topicScores,
      difficultyBreakdown: resultDetails.difficultyScores,
      strengths,
      weaknesses,
      recommendations: evaluation.recommendations.map((r) => ({
        id: r.id,
        skill: r.skill,
        priority: r.priority,
        title: r.title,
        description: r.description,
      })),
      improvementPlan,
    };
  }

  private generateImprovementPlan(
    weaknesses: string[],
    recommendations: any[],
  ): string[] {
    const plan: string[] = [];

    if (weaknesses.length === 0) {
      plan.push(
        "Excellent work! Continue practicing advanced concepts and keep up your current study habits.",
      );
      return plan;
    }

    plan.push(
      `1. Address core skills needing improvement: Focus on key areas: ${weaknesses.join(", ")}.`,
    );

    recommendations.forEach((rec, idx) => {
      if (idx < 2) {
        plan.push(
          `${idx + 2}. Study Action: ${rec.title} - ${rec.description}`,
        );
      }
    });

    plan.push(
      `${plan.length + 1}. Re-test preparation: Review previous feedback and answers before starting mock tests.`,
    );

    return plan;
  }
}
