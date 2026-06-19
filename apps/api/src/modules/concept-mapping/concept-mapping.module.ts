import { Module } from "@nestjs/common";
import { ConceptMappingController } from "./controllers/concept-mapping.controller";
import { ConceptMappingService } from "./services/concept-mapping.service";
import { ConceptMappingRepository } from "./repositories/concept-mapping.repository";
import { TopicRegistryLoader } from "./services/topic-registry-loader.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { TopicController } from "./controllers/topic.controller";
import { TopicService } from "./services/topic.service";
import { TopicRepository } from "./repositories/topic.repository";

@Module({
  imports: [PrismaModule],
  controllers: [ConceptMappingController, TopicController],
  providers: [
    ConceptMappingService,
    ConceptMappingRepository,
    TopicService,
    TopicRepository,
    TopicRegistryLoader,
  ],
  exports: [
    ConceptMappingService,
    ConceptMappingRepository,
    TopicService,
    TopicRepository,
    TopicRegistryLoader,
  ],
})
export class ConceptMappingModule {}
