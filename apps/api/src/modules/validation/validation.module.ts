import { Module } from "@nestjs/common";
import { ReadinessController } from "./controllers/readiness.controller";
import { SystemValidationController } from "./controllers/system-validation.controller";
import { ReadinessEngineService } from "./services/readiness-engine.service";
import { CrossModuleValidatorService } from "./services/cross-module-validator.service";
import { ReadinessReportRepository } from "./repositories/readiness-report.repository";
import { PrismaModule } from "../../prisma/prisma.module";
import { AdminConfigModule } from "../admin-config/admin-config.module";
import { ConceptMappingModule } from "../concept-mapping/concept-mapping.module";
import { TopicSectionMappingModule } from "../topic-section-mapping/topic-section-mapping.module";
import { TemplateLibraryModule } from "../template-library/template-library.module";
import { BlueprintModule } from "../blueprint/blueprint.module";

@Module({
  imports: [
    PrismaModule,
    AdminConfigModule,
    ConceptMappingModule,
    TopicSectionMappingModule,
    TemplateLibraryModule,
    BlueprintModule,
  ],
  controllers: [ReadinessController, SystemValidationController],
  providers: [
    ReadinessEngineService,
    CrossModuleValidatorService,
    ReadinessReportRepository,
  ],
  exports: [
    ReadinessEngineService,
    CrossModuleValidatorService,
    ReadinessReportRepository,
  ],
})
export class ValidationModule {}
