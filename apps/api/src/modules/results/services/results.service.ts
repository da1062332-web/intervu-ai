import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { EvaluationRepository } from "../repositories/evaluation.repository";
import { ResultMapper } from "../mappers/result.mapper";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  ResultNotFoundError,
  UnauthorizedResultAccessError,
  ResultResponseDto,
} from "@intervu/shared";
import { ResultGeneratorService } from "../../evaluation/services/result-generator.service";
import { EvaluationExplainabilityService } from "../../evaluation/insights/explainability.service";
import { CandidateResultDto } from "@intervu-ai/contracts";

@Injectable()
export class ResultsService {
  private readonly logger = new Logger("ResultsService");

  constructor(
    private readonly evaluationRepository: EvaluationRepository,
    private readonly prisma: PrismaService,
    private readonly resultGenerator: ResultGeneratorService,
    private readonly explainabilityService: EvaluationExplainabilityService,
  ) {}

  async getEvaluation(evaluationId: string) {
    const evaluation =
      await this.evaluationRepository.findEvaluationWithDetails(evaluationId);
    if (!evaluation) {
      const attemptEval = await this.prisma.evaluationResult.findFirst({
        where: { testInstanceId: evaluationId },
        include: { skillScores: true },
      });
      if (!attemptEval) {
        throw new ResultNotFoundError();
      }
      return attemptEval;
    }
    return evaluation;
  }

  async getResultDetails(userId: string, idOrAttemptId: string): Promise<any> {
    const evaluation = await this.getEvaluation(idOrAttemptId);

    if (userId && evaluation.userId && evaluation.userId !== userId) {
      this.logger.error(
        "SEC-001: Unauthorized result access attempt",
        {
          evaluationUserId: evaluation.userId,
          requestUserId: userId,
        },
      );
      throw new UnauthorizedResultAccessError();
    }

    const testInstanceId = evaluation.testInstanceId;
    if (!testInstanceId) {
      return this.composeResultResponse(evaluation);
    }

    const testInstance = await this.prisma.testInstance.findUnique({
      where: { id: testInstanceId },
      include: {
        candidateAnswers: true,
        testConfig: true,
        examConfig: true,
        user: true,
      },
    });

    if (!testInstance) {
      return this.composeResultResponse(evaluation);
    }

    const executionResult = {
      executionId: testInstance.id,
      testId:
        testInstance.testConfigId ||
        testInstance.examConfigId ||
        testInstance.id,
      status: "submitted",
      submittedAt: testInstance.submittedAt || new Date(),
      answers: testInstance.candidateAnswers.map((a) => ({
        questionId: a.questionId,
        answer: String(a.answer),
        timeSpentSeconds: a.timeSpentSeconds || 0,
        isMarkedForReview: a.isMarkedForReview || false,
      })),
    };

    const fullResult =
      await this.resultGenerator.generateResult(executionResult);

    const assessmentName =
      testInstance.testConfig?.displayName ||
      testInstance.examConfig?.name ||
      "Corporate Assessment";

    fullResult.id = evaluation.id;
    fullResult.createdAt = evaluation.createdAt;
    (fullResult as any).assessmentName = assessmentName;
    (fullResult as any).candidate = {
      fullName: (testInstance as any).user?.fullName || "Candidate",
      email: (testInstance as any).user?.email || "N/A",
    };

    (fullResult as any).explanations =
      await this.explainabilityService.getExplanation(
        testInstanceId,
        fullResult,
      );

    return fullResult;
  }

  private composeResultResponse(evaluation: any): ResultResponseDto {
    const rawAnswers = evaluation.evaluationData?.answers || [];
    const normalizedAnswers = rawAnswers.map((a: any) => ({
      questionId: a.questionId || a.id || "",
      userAnswer: a.answer || a.userAnswer || "",
      isCorrect: Boolean(a.isCorrect),
      score: Number(a.score || 0),
      timeTaken: Number(a.timeSpentSeconds || a.timeTaken || 0),
    }));

    const rawSkills = evaluation.skillScores || [];
    const normalizedSkills = rawSkills.map((s: any) => ({
      name: s.skillName || s.name || "General",
      score: Number(s.score || 0),
      accuracy: Number(s.percentage || s.accuracy || 0),
    }));

    return ResultMapper.toDto({
      ...evaluation,
      answers: normalizedAnswers,
      skillScores: normalizedSkills,
    });
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

    const testInstance = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
      include: { candidateAnswers: true, testConfig: true, examConfig: true },
    });

    if (!testInstance) {
      throw new NotFoundException(`Attempt ${attemptId} not found`);
    }

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

    const fullResult =
      await this.resultGenerator.generateResult(executionResult);

    const assessmentName =
      testInstance.testConfig?.displayName ||
      testInstance.examConfig?.name ||
      "Corporate Assessment";

    fullResult.id = candidateResult.id;
    fullResult.createdAt = candidateResult.createdAt;
    (fullResult as any).assessmentName = assessmentName;

    (fullResult as any).explanations =
      await this.explainabilityService.getExplanation(attemptId, fullResult);

    return fullResult;
  }

  /**
   * Lists all assessment results for a candidate.
   */
  async listCandidateResults(
    candidateId: string,
  ): Promise<CandidateResultDto[]> {
    const candidateResults = await this.prisma.candidateResult.findMany({
      where: { candidateId },
      include: {
        attempt: {
          include: {
            testConfig: true,
            examConfig: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return candidateResults.map((r: any) => ({
      id: r.id,
      candidateId: r.candidateId,
      attemptId: r.attemptId,
      assessmentName:
        r.attempt?.testConfig?.displayName ||
        r.attempt?.examConfig?.name ||
        "Corporate Assessment",
      score: r.score,
      percentage: r.percentage,
      evaluationStrategy: r.evaluationStrategy || undefined,
      qualification: r.qualification || undefined,
      qualificationReason: r.qualificationReason || undefined,
      foundationScore: r.foundationScore ?? undefined,
      advancedScore: r.advancedScore ?? undefined,
      codingSolved: r.codingSolved ?? undefined,
      qualificationDetails: r.qualificationDetails || undefined,
      evaluatedAt: r.evaluatedAt || undefined,
      createdAt: r.createdAt,
    }));
  }
}
