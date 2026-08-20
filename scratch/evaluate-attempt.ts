import { PrismaClient } from "@prisma/client";
import { ResultGeneratorService } from "../apps/api/src/modules/evaluation/services/result-generator.service";
import { ResultStorageService } from "../apps/api/src/modules/evaluation/services/result-storage.service";
import { ExecutionEvaluationIntegration } from "../apps/api/src/modules/evaluation/integrations/execution-evaluation.integration";
import { ObjectiveEvaluatorService } from "../apps/api/src/modules/evaluation/objective/objective-evaluator.service";
import { CodingEvaluatorService } from "../apps/api/src/modules/evaluation/objective/coding-evaluator.service";
import { SectionScoringService } from "../apps/api/src/modules/evaluation/scoring/section-scoring.service";
import { OverallScoreService } from "../apps/api/src/modules/evaluation/scoring/overall-score.service";
import { PerformanceAnalyticsService } from "../apps/api/src/modules/evaluation/analytics/performance-analytics.service";
import { StrengthWeaknessService } from "../apps/api/src/modules/evaluation/analytics/strength-weakness.service";
import { RecommendationService } from "../apps/api/src/modules/evaluation/recommendations/recommendation.service";
import { HiringEvaluationEngine } from "../apps/api/src/modules/evaluation/services/hiring-evaluation.engine";
import { HiringStrategyRegistry } from "../apps/api/src/modules/evaluation/strategies/hiring-strategy.registry";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  const attemptId = "wurfablihqtln4fbi677172u";
  console.log(`--- EVALUATING ATTEMPT: ${attemptId} ---`);

  const answers = await prisma.candidateAnswer.findMany({
    where: { testInstanceId: attemptId },
  });

  console.log(`Found ${answers.length} answer records for attempt`);

  const executionResult = {
    executionId: attemptId,
    testId: attemptId,
    status: "submitted",
    submittedAt: new Date(),
    answers: answers.map((a) => ({
      questionId: a.questionId,
      answer: String(a.answer || ""),
      timeSpentSeconds: a.timeSpentSeconds || 0,
      isMarkedForReview: a.isMarkedForReview || false,
    })),
  };

  const evaluator = new ObjectiveEvaluatorService();
  const codingEvaluator = new CodingEvaluatorService(null as any);
  const sectionScoring = new SectionScoringService();
  const overallScoring = new OverallScoreService();
  const analytics = new PerformanceAnalyticsService();
  const strengthWeakness = new StrengthWeaknessService();
  const recommendation = new RecommendationService();
  const hiringEngine = new HiringEvaluationEngine(
    prisma as any,
    new HiringStrategyRegistry(),
  );

  const resultGenerator = new ResultGeneratorService(
    prisma as any,
    evaluator,
    codingEvaluator,
    sectionScoring,
    overallScoring,
    analytics,
    strengthWeakness,
    recommendation,
    hiringEngine,
  );

  const resultStorage = new ResultStorageService(prisma as any);

  const integration = new ExecutionEvaluationIntegration(
    resultGenerator,
    resultStorage,
  );

  try {
    await integration.triggerEvaluation(executionResult as any);
    console.log("EVALUATION SUCCESSFUL!");

    const candidateResult = await prisma.candidateResult.findUnique({
      where: { attemptId },
    });
    console.log("Candidate Result Saved:", candidateResult);
  } catch (err: any) {
    console.error("EVALUATION FAILED WITH ERROR:", err);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
