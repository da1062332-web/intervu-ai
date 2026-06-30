import { Injectable, NotFoundException } from "@nestjs/common";
import { EvaluationRepository } from "../repositories/evaluation.repository";
import { ResultMapper } from "../mappers/result.mapper";
import {
  ResultNotFoundError,
  UnauthorizedResultAccessError,
} from "@intervu/shared";
import { ResultResponseDto } from "@intervu/shared";
import { PrismaService } from "../../../prisma/prisma.service";
import { ResultGeneratorService } from "../../evaluation/services/result-generator.service";
import { CandidateResultDto } from "@intervu-ai/contracts";

@Injectable()
export class ResultsService {
  constructor(
    private readonly evaluationRepository: EvaluationRepository,
    private readonly prisma: PrismaService,
    private readonly resultGenerator: ResultGeneratorService,
  ) {}

  async getEvaluation(evaluationId: string) {
    const evaluation =
      await this.evaluationRepository.findEvaluationWithDetails(evaluationId);
    if (!evaluation) {
      throw new ResultNotFoundError();
    }
    return evaluation;
  }

  async getResultDetails(
    userId: string,
    evaluationId: string,
  ): Promise<ResultResponseDto> {
    const evaluation = await this.getEvaluation(evaluationId);

    if (evaluation.userId !== userId) {
      throw new UnauthorizedResultAccessError();
    }

    return this.composeResultResponse(evaluation);
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  getSkillBreakdown(evaluation: any) {
    return evaluation.skillScores || [];
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  composeResultResponse(evaluation: any): ResultResponseDto {
    return ResultMapper.toDto(evaluation);
  }

  /**
   * Retrieves the candidate result for a specific test attempt.
   */
  async getCandidateResult(attemptId: string): Promise<CandidateResultDto> {
    const candidateResult = await this.prisma.candidateResult.findUnique({
      where: { attemptId },
    });

    if (!candidateResult) {
      throw new NotFoundException(`Result for attempt ${attemptId} not found`);
    }

    // Fetch attempt details to rebuild full DTO
    const testInstance = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
      include: { candidateAnswers: true },
    });

    if (!testInstance) {
      throw new NotFoundException(`Attempt ${attemptId} not found`);
    }

    // Reconstruct ExecutionResultDto for the generator pipeline
    const executionResult = {
      executionId: testInstance.id,
      testId: attemptId,
      status: "submitted",
      submittedAt: testInstance.submittedAt || new Date(),
      answers: testInstance.candidateAnswers.map((a) => ({
        questionId: a.questionId,
        answer: String(a.answer),
        timeSpentSeconds: a.timeSpentSeconds || 0,
        isMarkedForReview: a.isMarkedForReview || false,
      })),
    };

    const fullResult = await this.resultGenerator.generateResult(executionResult);
    
    // Override IDs with persisted DB records for consistency
    fullResult.id = candidateResult.id;
    fullResult.createdAt = candidateResult.createdAt;

    return fullResult;
  }

  /**
   * Lists all assessment results for a candidate.
   */
  async listCandidateResults(candidateId: string): Promise<CandidateResultDto[]> {
    const candidateResults = await this.prisma.candidateResult.findMany({
      where: { candidateId },
      orderBy: { createdAt: "desc" },
    });

    const results: CandidateResultDto[] = [];
    for (const res of candidateResults) {
      try {
        const fullResult = await this.getCandidateResult(res.attemptId);
        results.push(fullResult);
      } catch (err) {
        // Fallback to basic record if deep resolution fails
        results.push({
          id: res.id,
          candidateId: res.candidateId,
          attemptId: res.attemptId,
          score: res.score,
          percentage: res.percentage,
          createdAt: res.createdAt,
        });
      }
    }

    return results;
  }
}
