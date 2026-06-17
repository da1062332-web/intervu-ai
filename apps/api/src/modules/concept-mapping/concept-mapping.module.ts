import { Module } from "@nestjs/common";
import { ConceptMappingController } from "./controllers/concept-mapping.controller";
import { ConceptMappingService } from "./services/concept-mapping.service";
import { ConceptMappingRepository } from "./repositories/concept-mapping.repository";
import { TopicRegistryLoader } from "./services/topic-registry-loader.service";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ConceptMappingController],
  providers: [
    ConceptMappingService,
    ConceptMappingRepository,
    TopicRegistryLoader,
  ],
  exports: [
    ConceptMappingService,
    ConceptMappingRepository,
    TopicRegistryLoader,
  ],
})
export class ConceptMappingModule {}
