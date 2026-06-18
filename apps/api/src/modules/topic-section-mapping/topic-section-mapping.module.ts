import { Module } from "@nestjs/common";
import { TopicSectionMappingController } from "./controllers/topic-section-mapping.controller";
import { TopicSectionMappingService } from "./services/topic-section-mapping.service";
import { TopicSectionMappingRepository } from "./repositories/topic-section-mapping.repository";
import { ConceptMappingModule } from "../concept-mapping/concept-mapping.module";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule, ConceptMappingModule],
  controllers: [TopicSectionMappingController],
  providers: [TopicSectionMappingService, TopicSectionMappingRepository],
  exports: [TopicSectionMappingService, TopicSectionMappingRepository],
})
export class TopicSectionMappingModule {}
