import { Module, forwardRef } from "@nestjs/common";
import { GenerationAiModule } from "../generation-ai/generation-ai.module";
import { TemplateRepository } from "./repositories/template.repository";
import { TemplateVariableRepository } from "./repositories/template-variable.repository";
import { TemplateRuleRepository } from "./repositories/template-rule.repository";
import { TemplateService } from "./services/template.service";
import { TemplateController } from "./controllers/template.controller";
import { TemplateVariableController } from "./controllers/template-variable.controller";
import { TemplateRuleController } from "./controllers/template-rule.controller";
import { SolutionTemplateRepository } from "./repositories/solution-template.repository";
import { TemplatePreviewRepository } from "./repositories/template-preview.repository";
import { TemplateRendererService } from "./services/template-renderer.service";
import { PlaceholderValidatorService } from "./services/placeholder-validator.service";
import { SolutionTemplateService } from "./services/solution-template.service";

import { TemplateDatasetRepository } from "./repositories/template-dataset.repository";
import { TemplatePromptRepository } from "./repositories/template-prompt.repository";
import { TemplateDatasetService } from "./services/template-dataset.service";
import { TemplatePromptService } from "./services/template-prompt.service";
import { TemplateDatasetController } from "./controllers/template-dataset.controller";
import { TemplatePromptController } from "./controllers/template-prompt.controller";

@Module({
  imports: [forwardRef(() => GenerationAiModule)],
  controllers: [
    TemplateController,
    TemplateVariableController,
    TemplateRuleController,
    TemplateDatasetController,
    TemplatePromptController,
  ],
  providers: [
    TemplateRepository,
    TemplateVariableRepository,
    TemplateRuleRepository,
    SolutionTemplateRepository,
    TemplatePreviewRepository,
    TemplateDatasetRepository,
    TemplatePromptRepository,
    TemplateRendererService,
    PlaceholderValidatorService,
    SolutionTemplateService,
    TemplateDatasetService,
    TemplatePromptService,
    TemplateService,
  ],
  exports: [
    TemplateRepository,
    TemplateVariableRepository,
    TemplateRuleRepository,
    SolutionTemplateRepository,
    TemplatePreviewRepository,
    TemplateDatasetRepository,
    TemplatePromptRepository,
    TemplateRendererService,
    PlaceholderValidatorService,
    SolutionTemplateService,
    TemplateDatasetService,
    TemplatePromptService,
    TemplateService,
  ],
})
export class TemplateLibraryModule {}
