import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { QuestionBankModule } from "../question-bank/question-bank.module";
import { ConceptMappingModule } from "../concept-mapping/concept-mapping.module";
import { GenerationAiModule } from "../generation-ai/generation-ai.module";

import { QuestionReviewController } from "./controllers/question-review.controller";
import { AIReviewService } from "./reviewers/ai-review.service";
import { StructureAnalyzerService } from "./analyzers/structure-analyzer.service";
import { DifficultyAnalyzerService } from "./analyzers/difficulty-analyzer.service";
import { TopicAnalyzerService } from "./analyzers/topic-analyzer.service";
import { QuestionAnalyticsService } from "./analyzers/question-analytics.service";
import { QuestionEnrichmentService } from "./enrichers/question-enrichment.service";
import { ApprovalEngineService } from "./reviewers/approval-engine.service";
import { ReviewAuditService } from "./services/review-audit.service";
import { GenerationMonitorService } from "./monitoring/generation-monitor.service";

import { ReviewAuditLogRepository } from "./repositories/review-audit-log.repository";
import { GenerationMetricsRepository } from "./repositories/generation-metrics.repository";

@Module({
  imports: [
    PrismaModule,
    QuestionBankModule,
    ConceptMappingModule,
    GenerationAiModule,
  ],
  controllers: [QuestionReviewController],
  providers: [
    AIReviewService,
    StructureAnalyzerService,
    DifficultyAnalyzerService,
    TopicAnalyzerService,
    QuestionAnalyticsService,
    QuestionEnrichmentService,
    ApprovalEngineService,
    ReviewAuditService,
    GenerationMonitorService,
    ReviewAuditLogRepository,
    GenerationMetricsRepository,
  ],
  exports: [AIReviewService, GenerationMonitorService, ReviewAuditService],
})
export class QuestionReviewModule {}
