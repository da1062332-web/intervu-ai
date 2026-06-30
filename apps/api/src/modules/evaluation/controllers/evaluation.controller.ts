import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  NotFoundException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ValidateResponse } from "@intervu/shared";
import { z } from "zod";
import { EvaluationService } from "../services/evaluation.service";
import { EvaluationQueueService } from "../services/evaluation-queue.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Roles } from "../../auth/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { ObjectiveEvaluatorService } from "../objective/objective-evaluator.service";
import { SectionScoringService } from "../scoring/section-scoring.service";
import { OverallScoreService } from "../scoring/overall-score.service";
@ApiTags("evaluation")
@ApiBearerAuth("jwt-auth")
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN, UserRole.CANDIDATE)
@Controller("evaluation")
export class EvaluationController {
  constructor(
    private readonly evaluationService: EvaluationService,
    private readonly evaluationQueueService: EvaluationQueueService,
    private readonly prisma: PrismaService,
    private readonly evaluator: ObjectiveEvaluatorService,
    private readonly sectionScoring: SectionScoringService,
    private readonly overallScoring: OverallScoreService,
  ) {}

  @Post(":answerId/evaluate")
  @HttpCode(HttpStatus.OK)
  @ValidateResponse(z.unknown())
  @ApiOperation({ summary: "Trigger evaluation for an answer" })
  async evaluateAnswer(@Param("answerId") answerId: string) {
    return this.evaluationService.evaluateAnswer(answerId);
  }

  @Get(":answerId")
  @HttpCode(HttpStatus.OK)
  @ValidateResponse(z.unknown())
  @ApiOperation({ summary: "Get evaluation result" })
  async getEvaluation(@Param("answerId") answerId: string) {
    return this.evaluationService.getEvaluation(answerId);
  }

  @Post("score")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Generate overall score for an attempt" })
  async calculateScore(@Body() body: { attemptId: string }) {
    const { attemptId } = body;
    if (!attemptId) {
      throw new NotFoundException("attemptId is required");
    }

    // 1. Fetch test instance with sections/questions
    const testInstance = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
      include: {
        candidateAnswers: true,
        sections: {
          orderBy: { orderIndex: "asc" },
          include: {
            questions: {
              orderBy: { questionOrder: "asc" },
            },
          },
        },
      },
    });

    if (!testInstance) {
      throw new NotFoundException(`Attempt ${attemptId} not found`);
    }

    // 2. Map questions ground truth
    const questionsList: Array<{
      id: string;
      answer: string;
      questionType: string;
      difficulty: string;
      topicName: string;
      sectionKey: string;
    }> = [];

    const parsedSections = testInstance.sections.map((section) => {
      const sectionQuestions = section.questions.map((q) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const snap = (q.questionSnapshot || {}) as any;
        const answer = snap.answer || snap.correctAnswer || "";
        const questionType = snap.questionType || snap.type || "MCQ";
        const difficulty = snap.difficulty || snap.difficultyLevel || "MEDIUM";
        const topicName = snap.topicName || snap.conceptKey || "General";

        questionsList.push({
          id: q.questionId,
          answer,
          questionType,
          difficulty,
          topicName,
          sectionKey: section.sectionKey,
        });

        return { questionId: q.questionId };
      });

      return {
        id: section.id,
        sectionKey: section.sectionKey,
        sectionName: section.sectionName,
        questions: sectionQuestions,
      };
    });

    // 3. Map candidate answers
    const answers = testInstance.candidateAnswers.map((a) => ({
      questionId: a.questionId,
      selectedOptionId: String(a.answer),
      selectedOptionIds:
        String(a.answer).startsWith("[") && String(a.answer).endsWith("]")
          ? JSON.parse(String(a.answer))
          : undefined,
      textResponse: String(a.answer),
      status: "ANSWERED" as const,
      timeSpentSeconds: a.timeSpentSeconds || 0,
    }));

    // 4. Evaluate and calculate scores
    const evalResults = this.evaluator.evaluateAnswers(answers, questionsList);
    const sectionScores = this.sectionScoring.calculateSectionScores(
      evalResults,
      parsedSections,
    );
    return this.overallScoring.calculateOverallScore(sectionScores);
  }

  @Post("queue")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Queue evaluation for a test attempt" })
  async enqueueEvaluation(
    @Body()
    body: {
      attemptId: string;
      userId: string;
      answers: Record<string, string>;
    },
  ) {
    // Generate a fallback submission ID if not already existing
    const submissionId = `sub-${body.attemptId}`;
    return this.evaluationQueueService.enqueueSubmission(
      submissionId,
      body.attemptId,
      body.userId,
      body.answers,
    );
  }

  @Get(":attemptId/status")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Check evaluation queue status for an attempt" })
  async getEvaluationStatus(@Param("attemptId") attemptId: string) {
    return this.evaluationQueueService.getEvaluationStatus(attemptId);
  }

  @Post(":attemptId/retry")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Retry a failed evaluation" })
  async retryFailedEvaluation(@Param("attemptId") attemptId: string) {
    return this.evaluationQueueService.retryFailedEvaluation(attemptId);
  }
}
