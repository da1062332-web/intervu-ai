import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { BenchmarkService } from "../benchmarking/benchmark.service";
import {
  CandidateResultDto,
  EvaluationExplanation,
} from "@intervu-ai/contracts";

@Injectable()
export class EvaluationExplainabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly benchmarkService: BenchmarkService,
  ) {}

  /**
   * Generates dynamic, traceable explanations for score, recommendations, benchmark, and rank.
   */
  async getExplanation(
    attemptId: string,
    result: CandidateResultDto,
  ): Promise<EvaluationExplanation> {
    const score = result.percentage;
    const sections = result.sections || [];
    const correct = sections.reduce((acc, s) => acc + s.correct, 0);
    const total = sections.reduce(
      (acc, s) => acc + (s.correct + s.incorrect + s.skipped),
      0,
    );

    // 1. Score Explanation
    const scoreExplanation = `Your overall score of ${score}% is determined by answering ${correct} out of ${total} questions correctly across ${sections.length} section(s).`;

    // 2. Recommendation Reason
    const recs = result.recommendations || [];
    const weakTopics = recs
      .filter((r) => r.priority === "HIGH" || r.priority === "MEDIUM")
      .map((r) => r.title.replace("Improve ", ""));

    const recommendationReason =
      weakTopics.length > 0
        ? `Improvement recommendations were generated for the following weak topics: ${weakTopics.join(", ")} because your accuracy in these areas fell below the 75% mastery threshold.`
        : `A low-priority study recommendation was provided because you achieved 75% or higher accuracy across all assessment topics.`;

    // 3. Benchmark Reason
    let benchmarkReason = `Your score of ${score}% is evaluated against cohort averages. Benchmarking calculations are currently pending.`;
    try {
      const benchmark = await this.benchmarkService.getBenchmark(attemptId);
      const diff = score - benchmark.assessmentAverage;
      if (diff > 0) {
        benchmarkReason = `Your score of ${score}% is ${Math.round(diff)}% higher than the cohort average of ${Math.round(benchmark.assessmentAverage)}%.`;
      } else if (diff < 0) {
        benchmarkReason = `Your score of ${score}% is ${Math.round(Math.abs(diff))}% lower than the cohort average of ${Math.round(benchmark.assessmentAverage)}%.`;
      } else {
        benchmarkReason = `Your score of ${score}% matches the cohort average of ${Math.round(benchmark.assessmentAverage)}% exactly.`;
      }
    } catch {
      // Fallback if BenchmarkService throws (e.g. during initial generation)
    }

    // 4. Ranking Reason
    let rankingReason = `Your cohort ranking calculation is currently pending.`;
    try {
      const ranking = await this.prisma.candidateRanking.findUnique({
        where: { attemptId },
      });
      if (ranking) {
        rankingReason = `You ranked #${ranking.assessmentRank} out of ${ranking.totalAssessmentCandidates} candidates in this assessment, placing you in the ${ranking.percentile.toFixed(1)}th percentile.`;
      }
    } catch {
      // Fallback
    }

    return {
      scoreExplanation,
      recommendationReason,
      benchmarkReason,
      rankingReason,
    };
  }
}
