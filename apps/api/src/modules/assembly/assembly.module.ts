import { Module } from "@nestjs/common";
import { AssemblyController } from "./controllers/assembly.controller";
import { AssemblyService } from "./services/test-assembly.service";
import { BlueprintBuilderService } from "./services/blueprint-builder.service";
import { QuestionAllocatorService } from "./services/question-allocator.service";
import { SectionBuilderService } from "./services/section-builder.service";
import { AssemblyValidatorService } from "./validators/assembly-validator.service";
import { AntiRepetitionService } from "./services/anti-repetition.service";
import { AssemblyRepository } from "./repositories/assembly.repository";
import { BlueprintRepository } from "./repositories/blueprint.repository";
import { QuestionPoolRepository } from "./repositories/question-pool.repository";
import { PrismaModule } from "../../prisma/prisma.module";
import { QuestionPoolModule } from "../question-pool/question-pool.module";
import { QuestionBankModule } from "../question-bank/question-bank.module";
import { TestConfigRepository } from "../tests/repositories/test-config.repository";
import { SEMANTIC_SIMILARITY_PROVIDER } from "./providers/semantic-similarity.provider";
import { MockSemanticSimilarityProvider } from "./providers/mock-semantic-similarity.provider";
import { AssembledTestRepository } from "./repositories/assembled-test.repository";
import { AssemblyVersionRepository } from "./repositories/assembly-version.repository";
import { AssemblyAuditRepository } from "./repositories/assembly-audit.repository";
import { AssemblyPersistenceService } from "./services/assembly-persistence.service";
import { AssemblyAuditService } from "./services/assembly-audit.service";
import { AssemblyVersionService } from "./services/assembly-version.service";
import { DistributionAnalyticsService } from "./services/distribution-analytics.service";
import { AssemblyPublisherService } from "./services/assembly-publisher.service";
import { BlueprintSimulationService } from "./services/blueprint-simulation.service";
import { QUESTION_SOURCE_TOKEN } from "./services/question-source.interface";
// --- New Integration Layer Services ---
import { QuestionBankSource } from "./services/question-bank-source";
import { IntelligentAllocationService } from "./services/intelligent-allocation.service";
import { DuplicateDetectionService } from "./services/duplicate-detection.service";
import { AssemblyValidationV2Service } from "./services/assembly-validation-v2.service";
import { TestPackageService } from "./services/test-package.service";
import { PublishReadinessService } from "./services/publish-readiness.service";

@Module({
  imports: [PrismaModule, QuestionPoolModule, QuestionBankModule],
  controllers: [AssemblyController],
  providers: [
    // --- Existing services (preserved, untouched) ---
    AssemblyService,
    BlueprintBuilderService,
    QuestionAllocatorService,
    SectionBuilderService,
    AssemblyValidatorService,
    AntiRepetitionService,
    AssemblyRepository,
    BlueprintRepository,
    QuestionPoolRepository,
    TestConfigRepository,
    AssembledTestRepository,
    AssemblyVersionRepository,
    AssemblyAuditRepository,
    AssemblyPersistenceService,
    AssemblyAuditService,
    AssemblyVersionService,
    DistributionAnalyticsService,
    AssemblyPublisherService,
    BlueprintSimulationService,
    // --- New Integration Layer Services ---
    QuestionBankSource,
    DuplicateDetectionService,
    AssemblyValidationV2Service,
    IntelligentAllocationService,
    TestPackageService,
    PublishReadinessService,
    // --- DI Token Bindings ---
    // QUESTION_SOURCE_TOKEN now wired to real QuestionBankSource.
    // QuestionBankSource falls back to QuestionPoolRepository (GeneratedQuestion)
    // if the real Question bank has no ACTIVE questions for the requested topic.
    {
      provide: QUESTION_SOURCE_TOKEN,
      useExisting: QuestionBankSource,
    },
    {
      provide: SEMANTIC_SIMILARITY_PROVIDER,
      useClass: MockSemanticSimilarityProvider,
    },
  ],
  exports: [
    AssemblyService,
    AssemblyPublisherService,
    // Export new services for Module 4 / other consumers
    TestPackageService,
    PublishReadinessService,
    AssemblyValidationV2Service,
    DuplicateDetectionService,
  ],
})
export class AssemblyModule {}
