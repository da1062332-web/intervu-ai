import { Module } from '@nestjs/common';
import { TemplateRepository } from './repositories/template.repository';

@Module({
  providers: [TemplateRepository],
  exports: [TemplateRepository],
})
export class TemplateLibraryModule {}
