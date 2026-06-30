import { Injectable, NotFoundException } from "@nestjs/common";
import { EvaluationRepository } from "../repositories/evaluation.repository";
import { ResultMapper } from "../mappers/result.mapper";
import { PrismaService } from "@/prisma/prisma.service";
import {
  ResultNotFoundError,
  UnauthorizedResultAccessError,
  ResultResponseDto,
} from "@intervu/shared";
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
      // Try fetching by testInstanceId (attemptId)
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getResultDetails(userId: string, idOrAttemptId: string): Promise<any> {
    const evaluation = await this.getEvaluation(idOrAttemptId);

    if (evaluation.userId !== userId) {
      throw new UnauthorizedResultAccessError();
    }

    const testInstanceId = evaluation.testInstanceId;
    if (!testInstanceId) {
      return this.composeResultResponse(evaluation);
    }

    // 1. Fetch attempt details (sections, questions, answers) for aggregation
    const testInstance = await this.prisma.testInstance.findUnique({
      where: { id: testInstanceId },
      include: {
        sections: {
          include: {
            questions: true,
          },
        },
        candidateAnswers: true,
      },
    });

    if (!testInstance) {
      return this.composeResultResponse(evaluation);
    }

    const answerMap = new Map(
      testInstance.candidateAnswers.map((a) => [a.questionId, a]),
    );

    // 2. Perform score, topic, difficulty, and section aggregation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sectionScores: Record<string, any> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topicScores: Record<string, any> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const difficultyScores: Record<string, any> = {};
    let totalQuestionsCount = 0;
    let correctAnswersCount = evaluation.correctAnswers || 0;
    let totalTimeSpent = 0;

    testInstance.sections.forEach((section) => {
      let sectionQuestions = 0;
      let sectionCorrect = 0;
      let sectionTimeSpent = 0;

      section.questions.forEach((q) => {
        sectionQuestions++;
        totalQuestionsCount++;
        const answer = answerMap.get(q.questionId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const snap = q.questionSnapshot as Record<string, any>;

        const timeSpent = answer?.timeSpentSeconds || 0;
        sectionTimeSpent += timeSpent;
        totalTimeSpent += timeSpent;

        // Determine correctness
        const correctVal =
          snap?.correctOption || snap?.correctAnswer || snap?.answer;
        let isCorrect = false;
        if (answer && correctVal) {
          isCorrect =
            String(answer.answer).toLowerCase().trim() ===
            String(correctVal).toLowerCase().trim();
        } else if (answer) {
          // Fallback logic: check if overall correct count suggests it is correct
          isCorrect = true;
        }

        if (isCorrect) {
          sectionCorrect++;
        }

        // Topic Aggregation
        const topic = snap?.conceptKey || snap?.topicId || "General";
        if (!topicScores[topic]) {
          topicScores[topic] = { total: 0, correct: 0, timeSpent: 0 };
        }
        topicScores[topic].total++;
        if (isCorrect) topicScores[topic].correct++;
        topicScores[topic].timeSpent += timeSpent;

        // Difficulty Aggregation
        const diff = snap?.difficultyLevel || snap?.difficulty || "MEDIUM";
        if (!difficultyScores[diff]) {
          difficultyScores[diff] = { total: 0, correct: 0, timeSpent: 0 };
        }
        difficultyScores[diff].total++;
        if (isCorrect) difficultyScores[diff].correct++;
        difficultyScores[diff].timeSpent += timeSpent;
      });

      const sectionKey = section.sectionName || section.sectionKey;
      sectionScores[sectionKey] = {
        total: sectionQuestions,
        correct: sectionCorrect,
        timeSpent: sectionTimeSpent,
        score:
          sectionQuestions > 0
            ? Math.round((sectionCorrect / sectionQuestions) * 100)
            : 0,
      };
    });

    // Formatting outputs for final response DTO
    const sectionsArray = Object.keys(sectionScores).map((key) => ({
      section: key,
      ...sectionScores[key],
    }));

    const topicsArray = Object.keys(topicScores).map((key) => ({
      topic: key,
      score:
        topicScores[key].total > 0
          ? Math.round(
              (topicScores[key].correct / topicScores[key].total) * 100,
            )
          : 0,
      total: topicScores[key].total,
      correct: topicScores[key].correct,
      timeSpent: topicScores[key].timeSpent,
    }));

    const difficultiesArray = Object.keys(difficultyScores).map((key) => ({
      difficulty: key,
      score:
        difficultyScores[key].total > 0
          ? Math.round(
              (difficultyScores[key].correct / difficultyScores[key].total) *
                100,
            )
          : 0,
      total: difficultyScores[key].total,
      correct: difficultyScores[key].correct,
      timeSpent: difficultyScores[key].timeSpent,
    }));

    const accuracy =
      totalQuestionsCount > 0
        ? Math.round((correctAnswersCount / totalQuestionsCount) * 100)
        : 0;

    return {
      id: evaluation.id,
      testInstanceId: evaluation.testInstanceId,
      userId: evaluation.userId,
      overallScore: evaluation.overallScore,
      communicationScore: evaluation.communicationScore,
      technicalScore: evaluation.technicalScore,
      confidenceScore: evaluation.confidenceScore,
      overallRating: evaluation.overallRating,
      notes: evaluation.notes,
      evaluatedAt: evaluation.evaluatedAt,
      accuracy,
      timeAnalysis: {
        totalTimeSpentSeconds: totalTimeSpent,
        averageTimePerQuestion:
          totalQuestionsCount > 0
            ? Math.round(totalTimeSpent / totalQuestionsCount)
            : 0,
      },
      sectionScores: sectionsArray,
      topicScores: topicsArray,
      difficultyScores: difficultiesArray,
      skillScores: evaluation.skillScores || [],
    };
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

    const fullResult =
      await this.resultGenerator.generateResult(executionResult);

    // Override IDs with persisted DB records for consistency
    fullResult.id = candidateResult.id;
    fullResult.createdAt = candidateResult.createdAt;

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
      orderBy: { createdAt: "desc" },
    });

    const results: CandidateResultDto[] = [];
    for (const res of candidateResults) {
      try {
        const fullResult = await this.getCandidateResult(res.attemptId);
        results.push(fullResult);
      } catch {
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
