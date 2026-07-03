import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

export interface ReliabilityReportDto {
  missingScoresCount: number;
  duplicateEvaluationsCount: number; // Will generally be 0 due to DB unique constraints
  partialEvaluationsCount: number;
  calculationFailuresCount: number;
  anomalousAttempts: {
    attemptId: string;
    issue: "MISSING_SCORE" | "PARTIAL_EVALUATION" | "CALCULATION_FAILURE";
    details?: string;
  }[];
}

@Injectable()
export class EvaluationReliabilityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Scans the database to compile a reliability audit report on assessment evaluations.
   */
  async generateReliabilityReport(): Promise<ReliabilityReportDto> {
    const anomalousAttempts: ReliabilityReportDto["anomalousAttempts"] = [];

    // 1. Detect Missing Scores
    // TestInstances that have a Submission (status SUBMITTED or EVALUATED) but no CandidateResult
    const missingScoreAttempts = await this.prisma.testInstance.findMany({
      where: {
        submission: { isNot: null },
        candidateResult: null,
      },
      select: { id: true },
    });

    missingScoreAttempts.forEach((att) => {
      anomalousAttempts.push({
        attemptId: att.id,
        issue: "MISSING_SCORE",
        details:
          "Submission exists but no CandidateResult score record is created.",
      });
    });

    // 2. Detect Partial Evaluations
    // TestInstances that have a CandidateResult but are missing EvaluationAnalytics or sections
    const partialEvaluationAttempts = await this.prisma.testInstance.findMany({
      where: {
        candidateResult: { isNot: null },
        evaluationAnalytics: null,
      },
      select: { id: true },
    });

    partialEvaluationAttempts.forEach((att) => {
      anomalousAttempts.push({
        attemptId: att.id,
        issue: "PARTIAL_EVALUATION",
        details: "Score exists but EvaluationAnalytics record is missing.",
      });
    });

    // 3. Detect Calculation Failures
    // Failed runs in EvaluationRun
    const failedEvaluationRuns = await this.prisma.evaluationRun.findMany({
      where: { status: "FAILED" },
      select: { attemptId: true, error: true },
    });

    failedEvaluationRuns.forEach((run) => {
      anomalousAttempts.push({
        attemptId: run.attemptId,
        issue: "CALCULATION_FAILURE",
        details: run.error || "Evaluation run failed in background.",
      });
    });

    return {
      missingScoresCount: missingScoreAttempts.length,
      duplicateEvaluationsCount: 0, // Enforced by database unique constraint on attemptId
      partialEvaluationsCount: partialEvaluationAttempts.length,
      calculationFailuresCount: failedEvaluationRuns.length,
      anomalousAttempts,
    };
  }
}
