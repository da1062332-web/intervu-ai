import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ResultsService } from "../../results/services/results.service";
import { AppLogger } from "@intervu-ai/shared-logger";
import { ReportAuditService } from "./report-audit.service";
import { AiAnalysisService } from "../../evaluation/insights/ai-analysis.service";

@Injectable()
export class CandidateReportService {
  private readonly logger = new AppLogger({ name: "CandidateReportService" });

  constructor(
    private readonly prisma: PrismaService,
    private readonly resultsService: ResultsService,
    private readonly auditService: ReportAuditService,
    private readonly aiAnalysisService: AiAnalysisService,
  ) {}

  async getCandidateReport(userId: string, attemptId: string): Promise<any> {
    this.logger.debug("Generating candidate report", { attemptId, userId });

    // 1. Fetch the TestInstance and user details
    const attempt = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
      include: {
        user: true,
        testConfig: true,
        examConfig: true,
        candidateAnswers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Assessment attempt ${attemptId} not found`);
    }

    // 2. Fetch the EvaluationResult or CandidateResult
    const evaluation = await this.prisma.evaluationResult.findUnique({
      where: { testInstanceId: attemptId },
      include: {
        skillScores: true,
        recommendations: true,
      },
    });

    // 3. Reuse ResultsService to calculate breakdown details
    let resultDetails: any = {};
    try {
      resultDetails = await this.resultsService.getResultDetails(
        attempt.userId,
        attemptId,
      );
    } catch (e) {
      this.logger.warn(`Failed to get resultDetails for ${attemptId}`, {
        error: e instanceof Error ? e.message : String(e),
      });
    }

    if (!evaluation && !resultDetails?.score && resultDetails?.score !== 0) {
      throw new NotFoundException(
        `Evaluation for attempt ${attemptId} has not been completed yet`,
      );
    }

    // 4. Calculate Rank and Percentile dynamically
    const allAttempts = await this.prisma.evaluationResult.findMany({
      where: {
        testInstance: {
          testConfigId: attempt.testConfigId,
          examConfigId: (attempt as any).examConfigId,
        },
      },
      select: {
        overallScore: true,
      },
    });

    const totalAttemptsCount = allAttempts.length;
    const score = evaluation?.overallScore ?? resultDetails?.score ?? 0;

    // Rank is the number of attempts with score higher than candidate + 1
    const countHigher = allAttempts.filter(
      (a) => a.overallScore > score,
    ).length;
    const rank = countHigher + 1;

    const countLess = allAttempts.filter((a) => a.overallScore < score).length;
    const countEqual = allAttempts.filter(
      (a) => a.overallScore === score,
    ).length;

    // Standard percentile formula: ((countLess + 0.5 * countEqual) / total) * 100
    const percentile =
      totalAttemptsCount > 0
        ? Math.round(
            ((countLess + 0.5 * countEqual) / totalAttemptsCount) * 100,
          )
        : 100;

    // 5. Use strengths, weaknesses, and recommendations directly from CandidateResultDto
    let strengths = resultDetails.strengths || [];
    let weaknesses = resultDetails.weaknesses || [];
    let recommendations = resultDetails.recommendations || [];

    try {
      const aiAnalysis =
        await this.aiAnalysisService.generateAnalysis(attemptId);
      if (aiAnalysis) {
        if (aiAnalysis.strengths && aiAnalysis.strengths.length > 0) {
          strengths = aiAnalysis.strengths.map((s: any) => ({
            title: s.title,
            description: s.detail,
          }));
        }
        if (aiAnalysis.weaknesses && aiAnalysis.weaknesses.length > 0) {
          weaknesses = aiAnalysis.weaknesses.map((w: any) => ({
            title: w.title,
            description: w.detail,
          }));
        }
        if (
          aiAnalysis.recommendations &&
          aiAnalysis.recommendations.length > 0
        ) {
          recommendations = aiAnalysis.recommendations.map((r: any) => ({
            title: r.title,
            description: r.action,
            priority: r.priority,
          }));
        }
      }
    } catch (err) {
      this.logger.error("Failed to fetch AI analysis for report", err);
    }

    // 6. Generate dynamic improvement plan based on weaknesses
    const improvementPlan = this.generateImprovementPlan(
      weaknesses,
      recommendations,
    );

    // 7. Log audit trail event
    await this.auditService.logReportViewed(attemptId);

    return {
      candidate: {
        fullName: (attempt as any).user?.fullName || "Candidate",
        email: (attempt as any).user?.email,
      },
      attemptId: attempt.id,
      assessmentName:
        (attempt as any).testConfig?.displayName ||
        (attempt as any).examConfig?.name ||
        "Unknown Assessment",
      submittedAt: attempt.submittedAt || attempt.updatedAt,
      assessment: {
        id: attempt.testConfigId || (attempt as any).examConfigId || "",
        title:
          (attempt as any).testConfig?.displayName ||
          (attempt as any).examConfig?.name ||
          "Unknown Assessment",
        totalDurationSeconds:
          (attempt as any).testConfig?.totalDurationSeconds ||
          ((attempt as any).examConfig
            ? (attempt as any).examConfig.durationMinutes * 60
            : 0),
      },
      score,
      rank,
      percentile,
      accuracy: resultDetails.percentage || 0,
      timeTaken: attempt.candidateAnswers.reduce(
        (total, a) => total + (a.timeSpentSeconds || 0),
        0,
      ),
      sectionBreakdown: (resultDetails.sections || []).map((s: any) => ({
        section: s.sectionName || s.sectionKey,
        score: s.percentage || 0,
        correct: s.correct || 0,
        total: s.totalQuestions || 0,
      })),
      topicBreakdown: Object.entries(
        resultDetails.analytics?.topicAccuracy || {},
      ).map(([topic, score]) => ({ topic, score })),
      difficultyBreakdown: Object.entries(
        resultDetails.analytics?.difficultyAccuracy || {},
      ).map(([difficulty, score]) => ({ difficulty, score })),
      strengths,
      weaknesses,
      recommendations,
      improvementPlan,
      qualification: resultDetails.qualification || null,
      qualificationReason: resultDetails.qualificationReason || null,
      evaluationStrategy: resultDetails.evaluationStrategy || null,
      foundationScore: resultDetails.foundationScore ?? null,
      advancedScore: resultDetails.advancedScore ?? null,
      codingSolved: resultDetails.codingSolved ?? null,
      qualificationDetails: resultDetails.qualificationDetails || null,
    };
  }

  private generateImprovementPlan(
    weaknesses: any[],
    recommendations: any[],
  ): string[] {
    const plan: string[] = [];

    if (weaknesses.length === 0) {
      plan.push(
        "Excellent work! Continue practicing advanced concepts and keep up your current study habits.",
      );
      return plan;
    }

    const weaknessNames = weaknesses
      .map((w: any) => (typeof w === "string" ? w : w.title))
      .filter(Boolean);
    plan.push(
      `1. Address core skills needing improvement: Focus on key areas: ${weaknessNames.join(", ")}.`,
    );

    recommendations.forEach((rec, idx) => {
      if (idx < 2) {
        plan.push(
          `${idx + 2}. Study Action: ${rec.title} - ${rec.description || rec.action || ""}`,
        );
      }
    });

    plan.push(
      `${plan.length + 1}. Re-test preparation: Review previous feedback and answers before starting mock tests.`,
    );

    return plan;
  }

  async getShareableReport(attemptId: string): Promise<any> {
    this.logger.debug("Generating shareable report", { attemptId });

    const attempt = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
      include: {
        testConfig: true,
        examConfig: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Assessment attempt ${attemptId} not found`);
    }

    const evaluation = await this.prisma.evaluationResult.findUnique({
      where: { testInstanceId: attemptId },
    });

    if (!evaluation) {
      return { status: "PENDING" };
    }

    const allAttempts = await this.prisma.evaluationResult.findMany({
      where: {
        testInstance: {
          testConfigId: attempt.testConfigId,
          examConfigId: (attempt as any).examConfigId,
        },
      },
      select: {
        overallScore: true,
      },
    });

    const totalAttemptsCount = allAttempts.length;
    const score = evaluation.overallScore;
    const countHigher = allAttempts.filter(
      (a) => a.overallScore > score,
    ).length;
    const rank = countHigher + 1;
    const countLess = allAttempts.filter((a) => a.overallScore < score).length;
    const countEqual = allAttempts.filter(
      (a) => a.overallScore === score,
    ).length;
    const percentile =
      totalAttemptsCount > 0
        ? Math.round(
            ((countLess + 0.5 * countEqual) / totalAttemptsCount) * 100,
          )
        : 100;

    return {
      assessment: {
        id: attempt.testConfigId || (attempt as any).examConfigId || "",
        title:
          (attempt as any).testConfig?.displayName ||
          (attempt as any).examConfig?.name ||
          "Unknown Assessment",
      },
      score,
      percentile,
      rank,
      completedAt: attempt.submittedAt || attempt.updatedAt,
    };
  }
}
