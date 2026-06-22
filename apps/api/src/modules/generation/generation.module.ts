import { Module } from "@nestjs/common";
import { GenerationService } from "./services/generation.service";
import { GenerationController } from "./controllers/generation.controller";
import { GenerationContextService } from "./services/generation-context.service";
import { TemplateSelectorService } from "./services/template-selector.service";
import { ParameterGeneratorService } from "./services/parameter-generator.service";
import { QuestionInstantiatorService } from "./services/question-instantiator.service";
import { QuestionValidationService } from "./services/question-validation.service";
import { GenerationOrchestratorService } from "./services/generation-orchestrator.service";

@Module({
  controllers: [GenerationController],
  providers: [
    GenerationService,
    GenerationContextService,
    TemplateSelectorService,
    ParameterGeneratorService,
    QuestionInstantiatorService,
    QuestionValidationService,
    GenerationOrchestratorService,
  ],
  exports: [
    GenerationService,
    GenerationContextService,
    TemplateSelectorService,
    ParameterGeneratorService,
    QuestionInstantiatorService,
    QuestionValidationService,
    GenerationOrchestratorService,
  ],
})
export class GenerationModule {}
