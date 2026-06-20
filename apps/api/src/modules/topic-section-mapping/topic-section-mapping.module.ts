import { Module } from "@nestjs/common";
import { TopicSectionMappingController } from "./controllers/topic-section-mapping.controller";
import { TopicWeightageController } from "./controllers/topic-weightage.controller";
import { TopicSectionMappingService } from "./services/topic-section-mapping.service";
import { TopicWeightageService } from "./services/topic-weightage.service";
import { TopicSectionMappingRepository } from "./repositories/topic-section-mapping.repository";
import { TopicWeightageRepository } from "./repositories/topic-weightage.repository";
import { ConceptMappingModule } from "../concept-mapping/concept-mapping.module";
import { AdminConfigModule } from "../admin-config/admin-config.module";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule, ConceptMappingModule, AdminConfigModule],
  controllers: [
    TopicSectionMappingController,
    TopicWeightageController,
  ],
  providers: [
    TopicSectionMappingService,
    TopicSectionMappingRepository,
    TopicWeightageService,
    TopicWeightageRepository,
  ],
  exports: [
    TopicSectionMappingService,
    TopicSectionMappingRepository,
    TopicWeightageService,
    TopicWeightageRepository,
  ],
})
export class TopicSectionMappingModule {}
