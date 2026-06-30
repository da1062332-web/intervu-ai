import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { EvaluationController } from "./controllers/evaluation.controller";
import { EvaluationService } from "./services/evaluation.service";
import { ObjectiveEvaluatorService } from "./objective/objective-evaluator.service";
import { SectionScoringService } from "./scoring/section-scoring.service";
import { OverallScoreService } from "./scoring/overall-score.service";
import { PerformanceAnalyticsService } from "./analytics/performance-analytics.service";
import { StrengthWeaknessService } from "./analytics/strength-weakness.service";
import { RecommendationService } from "./recommendations/recommendation.service";
import { ResultGeneratorService } from "./services/result-generator.service";
import { ResultStorageService } from "./services/result-storage.service";
import { ExecutionEvaluationIntegration } from "./integrations/execution-evaluation.integration";

@Module({
  imports: [PrismaModule],
  controllers: [EvaluationController],
  providers: [
    EvaluationService,
    ObjectiveEvaluatorService,
    SectionScoringService,
    OverallScoreService,
    PerformanceAnalyticsService,
    StrengthWeaknessService,
    RecommendationService,
    ResultGeneratorService,
    ResultStorageService,
    ExecutionEvaluationIntegration,
  ],
  exports: [
    EvaluationService,
    ObjectiveEvaluatorService,
    SectionScoringService,
    OverallScoreService,
    PerformanceAnalyticsService,
    StrengthWeaknessService,
    RecommendationService,
    ResultGeneratorService,
    ResultStorageService,
    ExecutionEvaluationIntegration,
  ],
})
export class EvaluationModule {}
