import { Module } from '@nestjs/common';
import { TemplateRepository } from './repositories/template.repository';
import { TemplateService } from './services/template.service';
import { TemplateController } from './controllers/template.controller';

@Module({
  controllers: [TemplateController],
  providers: [TemplateRepository, TemplateService],
  exports: [TemplateRepository, TemplateService],
})
export class TemplateLibraryModule {}
