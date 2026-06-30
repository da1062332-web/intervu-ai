import { Module } from "@nestjs/common";
import { EvaluationPersistenceService } from "./services/evaluation-persistence.service";
import { DashboardMetricsAggregator } from "./services/dashboard-metrics-aggregator";
import { ResultsController } from "./controllers/results.controller";
import { PerformanceController } from "./controllers/performance.controller";
import { ResultsService } from "./services/results.service";
import { RecommendationsService } from "./services/recommendations.service";
import { PerformanceService } from "./services/performance.service";
import { EvaluationRepository } from "./repositories/evaluation.repository";
import { RecommendationRepository } from "./repositories/recommendation.repository";
import { PerformanceRepository } from "./repositories/performance.repository";
import { PrismaModule } from "../../prisma/prisma.module";
import { EvaluationModule } from "../evaluation/evaluation.module";

@Module({
  imports: [PrismaModule, EvaluationModule],
  controllers: [ResultsController, PerformanceController],
  providers: [
    EvaluationPersistenceService,
    DashboardMetricsAggregator,
    ResultsService,
    RecommendationsService,
    PerformanceService,
    EvaluationRepository,
    RecommendationRepository,
    PerformanceRepository,
  ],
  exports: [
    EvaluationPersistenceService,
    DashboardMetricsAggregator,
    ResultsService,
    RecommendationsService,
    PerformanceService,
    EvaluationRepository,
    PerformanceRepository,
  ],
})
export class ResultsModule {}
