import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ObjectiveEvaluatorService } from "../objective/objective-evaluator.service";
import { CodingEvaluatorService } from "../objective/coding-evaluator.service";
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
    private readonly codingEvaluator: CodingEvaluatorService,
    private readonly sectionScoring: SectionScoringService,
    private readonly overallScoring: OverallScoreService,
    private readonly analytics: PerformanceAnalyticsService,
    private readonly strengthWeakness: StrengthWeaknessService,
    private readonly recommendation: RecommendationService,
  ) {}

  /**
   * Generates a complete CandidateResultDto from execution answers and test snapshots.
   * TCS classification is NOT run here — it runs async after result is saved.
   */
  async generateResult(
    executionResult: ExecutionResultDto,
  ): Promise<CandidateResultDto> {
    const attemptId = executionResult.testId;
    this.logger.info("Generating candidate assessment results", { attemptId });

    // 1. Single consolidated DB fetch — test instance + sections + questions in one query
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

    // 2. Collect all unique questionIds to batch-fetch metadata (instructions, questionStatement)
    const questionIds = new Set<string>();
    for (const section of testInstance.sections) {
      for (const q of section.questions) {
        if (q.questionId) questionIds.add(q.questionId);
      }
    }

    // 3. Batch fetch question metadata (instructions, questionStatement) in one query
    const dbQuestionsMap = new Map<string, { instructions: string | null; questionStatement: string | null }>();
    if (questionIds.size > 0) {
      const dbQuestions = await this.prisma.question.findMany({
        where: { id: { in: Array.from(questionIds) } },
        select: { id: true, instructions: true, questionStatement: true },
      });
      for (const q of dbQuestions) {
        dbQuestionsMap.set(q.id, {
          instructions: q.instructions,
          questionStatement: q.questionStatement,
        });
      }
    }

    // 4. Build question lists by type
    const objectiveQuestionsList: Array<{
      id: string;
      answer: string;
      questionType: string;
      difficulty: string;
      topicName: string;
      sectionKey: string;
    }> = [];

    const allTopics = await this.prisma.topic.findMany({ select: { id: true, name: true } });
    const dbTopicMap = new Map<string, string>();
    allTopics.forEach((t) => dbTopicMap.set(t.id, t.name));

    const parsedSections = testInstance.sections.map((section) => {
      const sectionQuestions = section.questions.map((q) => {
        const snap = (q.questionSnapshot || {}) as any;
        const answer = snap.answer || snap.correctAnswer || "";
        const questionType = (snap.questionType || snap.type || "MCQ").toUpperCase();
        const difficulty = snap.difficulty || snap.difficultyLevel || "MEDIUM";

        // Resolve topic display name
        let topicName = "General";
        if (snap.topic?.name) {
          topicName = snap.topic.name;
        } else if (snap.topicName && dbTopicMap.get(snap.topicName)) {
          topicName = dbTopicMap.get(snap.topicName)!;
        } else if (snap.topicName) {
          topicName = snap.topicName;
        } else if (snap.topicId && dbTopicMap.get(snap.topicId)) {
          topicName = dbTopicMap.get(snap.topicId)!;
        } else if (typeof snap.topic === "string" && dbTopicMap.get(snap.topic)) {
          topicName = dbTopicMap.get(snap.topic)!;
        } else if (snap.conceptKey && dbTopicMap.get(snap.conceptKey)) {
          topicName = dbTopicMap.get(snap.conceptKey)!;
        } else if (snap.conceptKey) {
          topicName = snap.conceptKey
            .split("_")
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
        }

        const meta = dbQuestionsMap.get(q.questionId);

        if (questionType === "CODING") {
          // Parse instructions JSON to extract constraints and testCases
          let constraints: string | undefined;
          let testCases: string | undefined;

          if (meta?.instructions) {
            try {
              const inst = JSON.parse(meta.instructions);
              constraints = inst.constraints || undefined;
              testCases = inst.testCases || undefined;
            } catch {
              // instructions is plain text — ignore
            }
          }

          codingQuestionsList.push({
            id: q.questionId,
            questionType,
            problemStatement: meta?.questionStatement || snap.questionStatement || snap.questionText || "",
            questionText: snap.questionText || snap.text || "",
            constraints,
            testCases,
            difficulty,
            topicName,
            sectionKey: section.sectionKey,
          });
        } else {
          objectiveQuestionsList.push({
            id: q.questionId,
            answer,
            questionType,
            difficulty,
            topicName,
            sectionKey: section.sectionKey,
          });
        }

        return { questionId: q.questionId };
      });

      return {
        id: section.id,
        sectionKey: section.sectionKey,
        sectionName: section.sectionName,
        questions: sectionQuestions,
      };
    });

    // 5. Map candidate answers
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

    // 6. Run evaluators — objective is synchronous, coding is parallel async
    const objectiveEvalResults = this.evaluator.evaluateAnswers(
      submissionAnswers,
      objectiveQuestionsList,
    );

    // Coding runs in parallel (Promise.all inside CodingEvaluatorService)
    const codingEvalResults = await this.codingEvaluator.evaluateAnswers(
      submissionAnswers,
      codingQuestionsList,
    );

    const allEvalResults = [...objectiveEvalResults, ...codingEvalResults];

    // 7. Section scoring
    const sectionScores = this.sectionScoring.calculateSectionScores(
      allEvalResults,
      parsedSections,
    );

    // 8. Overall scoring with split breakdown
    const overallScore = this.overallScoring.calculateOverallScore(
      sectionScores,
      objectiveEvalResults,
      codingEvalResults,
    );

    // 9. Analytics
    const allQuestions = [
      ...objectiveQuestionsList.map((q) => ({
        id: q.id,
        topicName: q.topicName,
        difficulty: q.difficulty,
        sectionKey: q.sectionKey,
      })),
      ...codingQuestionsList.map((q) => ({
        id: q.id,
        topicName: q.topicName,
        difficulty: q.difficulty,
        sectionKey: q.sectionKey,
      })),
    ];

    const performanceAnalytics = this.analytics.calculateAnalytics(
      allEvalResults,
      allQuestions,
    );

    // 10. Strengths & Weaknesses
    const { strengths, weaknesses } =
      this.strengthWeakness.determineStrengthsAndWeaknesses(performanceAnalytics);

    // 11. Recommendations
    const recommendationsList =
      this.recommendation.generateRecommendations(performanceAnalytics);

    // 12. Compute overall totals for enriched result
    const totalCorrect = allEvalResults.filter((r) => r.isCorrect).length;
    const totalAttempted = allEvalResults.filter(
      (r) => r.candidateAnswer && r.candidateAnswer.trim() !== "",
    ).length;
    const totalIncorrect = totalAttempted - totalCorrect;

    // 13. Assemble final result (TCS classification is NOT included — runs async later)
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
      // Enriched fields
      totalAttempted,
      totalCorrect,
      totalIncorrect,
      maxMarks: overallScore.maxMarks,
      objectiveScore: overallScore.objectiveScore,
      codingScore: overallScore.codingScore,
      passed: overallScore.passed,
    };
  }
}
