import { Module } from "@nestjs/common";
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

@Module({
  controllers: [
    TemplateController,
    TemplateVariableController,
    TemplateRuleController,
  ],
  providers: [
    TemplateRepository,
    TemplateVariableRepository,
    TemplateRuleRepository,
    SolutionTemplateRepository,
    TemplatePreviewRepository,
    TemplateRendererService,
    PlaceholderValidatorService,
    SolutionTemplateService,
    TemplateService,
  ],
  exports: [
    TemplateRepository,
    TemplateVariableRepository,
    TemplateRuleRepository,
    SolutionTemplateRepository,
    TemplatePreviewRepository,
    TemplateRendererService,
    PlaceholderValidatorService,
    SolutionTemplateService,
    TemplateService,
  ],
})
export class TemplateLibraryModule {}
