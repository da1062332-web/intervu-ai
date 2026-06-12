import { PrismaClient, RecommendationPriority } from "@prisma/client";
import {
  EvaluationResultRepository,
  SkillScoreRepository,
  RecommendationRepository,
} from "@intervu-ai/database";
import { DashboardMetricsAggregator } from "./dashboard-metrics-aggregator";
import { z } from "zod";

export const StoreEvaluationOutcomeSchema = z
  .object({
    evaluation: z.object({
      testId: z.string().optional(),
      testInstanceId: z.string().optional(),
      userId: z.string(),
      overallScore: z.number(),
      confidenceScore: z.number(),
      communicationScore: z.number().optional(),
      technicalScore: z.number().optional(),
      overallRating: z.number().optional(),
      notes: z.string().optional(),
      totalQuestions: z.number(),
      correctAnswers: z.number(),
      incorrectAnswers: z.number(),
    }),
    skills: z.array(
      z.object({
        skill: z.string(),
        score: z.number(),
        feedback: z.string(),
      }),
    ),
    recommendations: z.array(
      z.object({
        skill: z.string(),
        priority: z.nativeEnum(RecommendationPriority),
        title: z.string(),
        description: z.string(),
      }),
    ),
  })
  .refine(
    (data) =>
      (data.evaluation.testId && !data.evaluation.testInstanceId) ||
      (!data.evaluation.testId && data.evaluation.testInstanceId),
    {
      message:
        "Either testId or testInstanceId must be provided, but not both.",
      path: ["evaluation", "testId"],
    },
  );

export type StoreEvaluationOutcomeInput = z.infer<
  typeof StoreEvaluationOutcomeSchema
>;

export class EvaluationPersistenceService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly evaluationResultRepo: EvaluationResultRepository,
    private readonly skillScoreRepo: SkillScoreRepository,
    private readonly recommendationRepo: RecommendationRepository,
    private readonly metricsAggregator: DashboardMetricsAggregator,
  ) {}

  /**
   * Persists evaluation outcome, skill scores, recommendations,
   * and aggregates dashboard stats in a single atomic transaction.
   * Optimized to run in exactly 2 roundtrips (Nested write + atomic raw SQL upsert).
   */
  async storeEvaluationOutcome(
    data: StoreEvaluationOutcomeInput,
  ): Promise<void> {
    // 1. Validate input early and aggressively using Zod
    const validated = StoreEvaluationOutcomeSchema.parse(data);

    // 2. Execute entire flow in a single transaction
    await this.prisma.$transaction(
      async (tx) => {
        // 2a. Store EvaluationResult, SkillScores, and Recommendations using nested write (1 query roundtrip)
        const evalResult =
          await this.evaluationResultRepo.createEvaluationWithNested(
            {
              testId: validated.evaluation.testId,
              testInstanceId: validated.evaluation.testInstanceId || "", // enforced by refine XOR
              userId: validated.evaluation.userId,
              overallScore: validated.evaluation.overallScore,
              confidenceScore: validated.evaluation.confidenceScore,
              communicationScore: validated.evaluation.communicationScore,
              technicalScore: validated.evaluation.technicalScore,
              overallRating: validated.evaluation.overallRating,
              notes: validated.evaluation.notes,
              totalQuestions: validated.evaluation.totalQuestions,
              correctAnswers: validated.evaluation.correctAnswers,
              incorrectAnswers: validated.evaluation.incorrectAnswers,
            },
            validated.skills,
            validated.recommendations,
            tx,
          );

        // 2b. Update user's PerformanceSummary using atomic single-roundtrip math (1 query roundtrip)
        const date = evalResult.evaluatedAt || new Date();
        await this.metricsAggregator.aggregateAndUpsert(
          validated.evaluation.userId,
          validated.evaluation.overallScore,
          date,
          tx,
        );
      },
      {
        maxWait: 25000, // 25 seconds max wait to acquire connection
        timeout: 35000, // 35 seconds max execution timeout
      },
    );
  }
}
