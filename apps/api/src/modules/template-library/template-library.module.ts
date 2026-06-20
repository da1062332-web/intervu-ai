import { Module } from "@nestjs/common";
import { TemplateRepository } from "./repositories/template.repository";
import { TemplateVariableRepository } from "./repositories/template-variable.repository";
import { TemplateRuleRepository } from "./repositories/template-rule.repository";
import { TemplateService } from "./services/template.service";
import { TemplateController } from "./controllers/template.controller";
import { TemplateVariableController } from "./controllers/template-variable.controller";
import { TemplateRuleController } from "./controllers/template-rule.controller";

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
    TemplateService,
  ],
  exports: [
    TemplateRepository,
    TemplateVariableRepository,
    TemplateRuleRepository,
    TemplateService,
  ],
})
export class TemplateLibraryModule {}
