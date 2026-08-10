import { Module, forwardRef } from "@nestjs/common";
import { GenerationService } from "./services/generation.service";
import { GenerationController } from "./controllers/generation.controller";
import { QuestionGenerationController } from "./controllers/question-generation.controller";
import { GenerationContextService } from "./services/generation-context.service";
import { TemplateSelectorService } from "./services/template-selector.service";
import { ParameterGeneratorService } from "./services/parameter-generator.service";
import { QuestionInstantiatorService } from "./services/question-instantiator.service";
import { QuestionValidationService } from "./services/question-validation.service";
import { GenerationOrchestratorService } from "./services/generation-orchestrator.service";
import { GenerationStrategyResolver } from "./services/generation-strategy.resolver";
import { DatasetLoaderService } from "./services/dataset-loader.service";
import { EntityGeneratorService } from "./services/entity-generator.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { GenerationAiModule } from "../generation-ai/generation-ai.module";
import { QuestionGenerationModule } from "../question-generation/question-generation.module";

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => GenerationAiModule),
    forwardRef(() => QuestionGenerationModule),
  ],
  controllers: [GenerationController, QuestionGenerationController],
  providers: [
    GenerationService,
    GenerationContextService,
    TemplateSelectorService,
    ParameterGeneratorService,
    QuestionInstantiatorService,
    QuestionValidationService,
    GenerationOrchestratorService,
    GenerationStrategyResolver,
    DatasetLoaderService,
    EntityGeneratorService,
  ],
  exports: [
    GenerationService,
    GenerationContextService,
    TemplateSelectorService,
    ParameterGeneratorService,
    QuestionInstantiatorService,
    QuestionValidationService,
    GenerationOrchestratorService,
    GenerationStrategyResolver,
    DatasetLoaderService,
    EntityGeneratorService,
  ],
})
export class GenerationModule {}
