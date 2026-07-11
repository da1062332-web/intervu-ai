import { Injectable, NotFoundException } from "@nestjs/common";
import { TemplatePromptRepository } from "../repositories/template-prompt.repository";
import { TemplateRepository } from "../repositories/template.repository";
import { UpdateTemplatePromptConfigDto } from "@intervu/shared";

@Injectable()
export class TemplatePromptService {
  constructor(
    private readonly templatePromptRepo: TemplatePromptRepository,
    private readonly templateRepo: TemplateRepository,
  ) {}

  async getPromptConfig(templateId: string) {
    const template = await this.templateRepo.findById(templateId);
    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    const config = await this.templatePromptRepo.findByTemplateId(templateId);
    return config || null;
  }

  async savePromptConfig(
    templateId: string,
    dto: UpdateTemplatePromptConfigDto,
  ) {
    const template = await this.templateRepo.findById(templateId);
    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    const existing = await this.templatePromptRepo.findByTemplateId(templateId);
    if (existing) {
      return this.templatePromptRepo.update(existing.id, {
        systemPrompt: dto.systemPrompt,
        userPrompt: dto.userPrompt,
        instructions: dto.instructions,
        outputRules: dto.outputRules,
      });
    }

    return this.templatePromptRepo.create({
      systemPrompt: dto.systemPrompt,
      userPrompt: dto.userPrompt,
      instructions: dto.instructions,
      outputRules: dto.outputRules,
      template: { connect: { id: templateId } },
    });
  }
}
