import { Module, forwardRef } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { ConfigModule } from "../../config";
import { GenerationAiModule } from "../generation-ai/generation-ai.module";
import { EvaluationController } from "./controllers/evaluation.controller";
import { EvaluationService } from "./services/evaluation.service";
import { ObjectiveEvaluatorService } from "./objective/objective-evaluator.service";
import { CodingEvaluatorService } from "./objective/coding-evaluator.service";
import { SectionScoringService } from "./scoring/section-scoring.service";
import { OverallScoreService } from "./scoring/overall-score.service";
import { TcsClassificationService } from "./scoring/tcs-classification.service";
import { PerformanceAnalyticsService } from "./analytics/performance-analytics.service";
import { StrengthWeaknessService } from "./analytics/strength-weakness.service";
import { RecommendationService } from "./recommendations/recommendation.service";
import { ResultGeneratorService } from "./services/result-generator.service";
import { ResultStorageService } from "./services/result-storage.service";
import { ExecutionEvaluationIntegration } from "./integrations/execution-evaluation.integration";
import { EvaluationQueueService } from "./services/evaluation-queue.service";

// New services
import { CandidateRankingService } from "./ranking/candidate-ranking.service";
import { PercentileService } from "./ranking/percentile.service";
import { BenchmarkService } from "./benchmarking/benchmark.service";
import { TopicMasteryService } from "./analytics/topic-mastery.service";
import { AiInsightService } from "./insights/ai-insight.service";
import { ImprovementPlanService } from "./recommendations/improvement-plan.service";
import { EvaluationReliabilityService } from "./reliability/evaluation-reliability.service";
import { ReEvaluationService } from "./services/re-evaluation.service";
import { EvaluationWorkerService } from "./services/evaluation-worker.service";
import { EvaluationExplainabilityService } from "./insights/explainability.service";
import { EvaluationValidationService } from "./validation/services/evaluation-validation.service";

@Module({
  imports: [PrismaModule, ConfigModule, forwardRef(() => GenerationAiModule)],
  controllers: [EvaluationController],
  providers: [
    EvaluationService,
    EvaluationQueueService,
    ObjectiveEvaluatorService,
    CodingEvaluatorService,
    SectionScoringService,
    OverallScoreService,
    TcsClassificationService,
    PerformanceAnalyticsService,
    StrengthWeaknessService,
    RecommendationService,
    ResultGeneratorService,
    ResultStorageService,
    ExecutionEvaluationIntegration,
    CandidateRankingService,
    PercentileService,
    BenchmarkService,
    TopicMasteryService,
    AiInsightService,
    ImprovementPlanService,
    EvaluationReliabilityService,
    ReEvaluationService,
    EvaluationWorkerService,
    EvaluationExplainabilityService,
    EvaluationValidationService,
  ],
  exports: [
    EvaluationService,
    EvaluationQueueService,
    ObjectiveEvaluatorService,
    CodingEvaluatorService,
    SectionScoringService,
    OverallScoreService,
    TcsClassificationService,
    PerformanceAnalyticsService,
    StrengthWeaknessService,
    RecommendationService,
    ResultGeneratorService,
    ResultStorageService,
    ExecutionEvaluationIntegration,
    CandidateRankingService,
    PercentileService,
    BenchmarkService,
    TopicMasteryService,
    AiInsightService,
    ImprovementPlanService,
    EvaluationReliabilityService,
    ReEvaluationService,
    EvaluationWorkerService,
    EvaluationExplainabilityService,
    EvaluationValidationService,
  ],
})
export class EvaluationModule {}
