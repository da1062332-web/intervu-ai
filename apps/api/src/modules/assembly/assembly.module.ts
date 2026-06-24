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
import { TestConfigRepository } from "../tests/repositories/test-config.repository";
import { SEMANTIC_SIMILARITY_PROVIDER } from "./providers/semantic-similarity.provider";
import { MockSemanticSimilarityProvider } from "./providers/mock-semantic-similarity.provider";

@Module({
  imports: [PrismaModule, QuestionPoolModule],
  controllers: [AssemblyController],
  providers: [
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
    {
      provide: SEMANTIC_SIMILARITY_PROVIDER,
      useClass: MockSemanticSimilarityProvider,
    },
  ],
  exports: [AssemblyService],
})
export class AssemblyModule {}
