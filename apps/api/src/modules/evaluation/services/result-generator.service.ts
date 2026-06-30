import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ObjectiveEvaluatorService } from "../objective/objective-evaluator.service";
import { SectionScoringService } from "../scoring/section-scoring.service";
import { OverallScoreService } from "../scoring/overall-score.service";
import { PerformanceAnalyticsService } from "../analytics/performance-analytics.service";
import { StrengthWeaknessService } from "../analytics/strength-weakness.service";
import { RecommendationService } from "../recommendations/recommendation.service";
import { ExecutionResultDto } from "../../execution/dto/execution-result.dto";
import { CandidateResultDto } from "@intervu-ai/contracts";
import { randomUUID } from "crypto";
import { AppLogger } from "@intervu-ai/shared-logger";

@Injectable()
export class ResultGeneratorService {
  private readonly logger = new AppLogger({ name: "ResultGeneratorService" });

  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluator: ObjectiveEvaluatorService,
    private readonly sectionScoring: SectionScoringService,
    private readonly overallScoring: OverallScoreService,
    private readonly analytics: PerformanceAnalyticsService,
    private readonly strengthWeakness: StrengthWeaknessService,
    private readonly recommendation: RecommendationService,
  ) {}

  /**
   * Generates a complete CandidateResultDto from execution answers and test snapshots.
   */
  async generateResult(
    executionResult: ExecutionResultDto,
  ): Promise<CandidateResultDto> {
    const attemptId = executionResult.testId;
    this.logger.info("Generating candidate assessment results", { attemptId });

    // 1. Fetch test instance with sections and questions
    const testInstance = await this.prisma.testInstance.findUnique({
      where: { id: attemptId },
      include: {
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
      throw new NotFoundException(`Test instance ${attemptId} not found`);
    }

    // 2. Map questions snapshot data
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

        // Resolve topic display name or concept display name
        let topicName = "General";
        if (snap.topic && snap.topic.name) {
          topicName = snap.topic.name;
        } else if (snap.topicName) {
          topicName = snap.topicName;
        } else if (snap.conceptKey) {
          // Format concept keys like time_work -> Time and Work
          topicName = snap.conceptKey
            .split("_")
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
        }

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

    // 3. Map Candidate answers from ExecutionResult
    const submissionAnswers = executionResult.answers.map((a) => ({
      questionId: a.questionId,
      selectedOptionId: a.answer,
      selectedOptionIds:
        a.answer.startsWith("[") && a.answer.endsWith("]")
          ? JSON.parse(a.answer)
          : undefined,
      textResponse: a.answer,
      status: "ANSWERED" as const,
      timeSpentSeconds: a.timeSpentSeconds || 0,
    }));

    // 4. Run Objective Evaluator
    const evalResults = this.evaluator.evaluateAnswers(
      submissionAnswers,
      questionsList,
    );

    // 5. Run Section Scoring
    const sectionScores = this.sectionScoring.calculateSectionScores(
      evalResults,
      parsedSections,
    );

    // 6. Run Overall Scoring
    const overallScore =
      this.overallScoring.calculateOverallScore(sectionScores);

    // 7. Run Analytics
    const performanceAnalytics = this.analytics.calculateAnalytics(
      evalResults,
      questionsList,
    );

    // 8. Run Strength/Weakness
    const { strengths, weaknesses } =
      this.strengthWeakness.determineStrengthsAndWeaknesses(
        performanceAnalytics,
      );

    // 9. Run Recommendations
    const recommendationsList =
      this.recommendation.generateRecommendations(performanceAnalytics);

    // 10. Assemble and return final CandidateResultDto
    return {
      id: `res_${randomUUID()}`,
      candidateId: testInstance.userId,
      attemptId: testInstance.id,
      score: overallScore.totalMarks,
      percentage: overallScore.percentage,
      createdAt: new Date(),
      sections: sectionScores,
      analytics: performanceAnalytics,
      strengths,
      weaknesses,
      recommendations: recommendationsList,
    };
  }
}
