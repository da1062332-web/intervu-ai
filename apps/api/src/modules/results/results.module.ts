import { Module } from "@nestjs/common";
import { EvaluationPersistenceService } from "./services/evaluation-persistence.service";
import { DashboardMetricsAggregator } from "./services/dashboard-metrics-aggregator";

@Module({
  providers: [
    EvaluationPersistenceService,
    DashboardMetricsAggregator,
  ],
  exports: [
    EvaluationPersistenceService,
    DashboardMetricsAggregator,
  ],
})
export class ResultsModule {}
