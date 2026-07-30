import { Module } from "@nestjs/common";
import { ExamConfigController } from "./controllers/exam-config.controller";
import { ExamConfigService } from "./services/exam-config.service";
import { ExamConfigRepository } from "./repositories/exam-config.repository";
import { ExamSectionController } from "./controllers/exam-section.controller";
import { ExamSectionService } from "./services/exam-section.service";
import { ExamSectionRepository } from "./repositories/exam-section.repository";
import { ConfigurationValidatorService } from "./validators/configuration-validator.service";
import { ConfigDependencyValidatorService } from "./validators/config-dependency-validator.service";
import { ConfigPreviewService } from "./services/config-preview.service";
import { ConfigVersionService } from "./versioning/config-version.service";
import { ConfigPublisherService } from "./publishing/config-publisher.service";
import { ExamConfigReadinessService } from "./services/exam-config-readiness.service";
import { HiringEvaluationController } from "./controllers/hiring-evaluation.controller";
import { HiringEvaluationService } from "./services/hiring-evaluation.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { QuestionBankModule } from "../question-bank/question-bank.module";

@Module({
  imports: [PrismaModule, QuestionBankModule],
  controllers: [
    ExamConfigController,
    ExamSectionController,
    HiringEvaluationController,
  ],
  providers: [
    // Core CRUD
    ExamConfigService,
    ExamConfigRepository,
    ExamSectionService,
    ExamSectionRepository,
    HiringEvaluationService,
    // Validation Layer
    ConfigurationValidatorService,
    ConfigDependencyValidatorService,
    // Service Layer
    ConfigPreviewService,
    ExamConfigReadinessService,
    // Versioning
    ConfigVersionService,
    // Publishing
    ConfigPublisherService,
  ],
  exports: [
    ExamConfigService,
    ExamConfigRepository,
    ExamSectionService,
    ExamSectionRepository,
    HiringEvaluationService,
    ConfigurationValidatorService,
    ConfigDependencyValidatorService,
    ConfigPreviewService,
    ExamConfigReadinessService,
    ConfigVersionService,
    ConfigPublisherService,
  ],
})
export class AdminConfigModule {}
