import { QuestionTemplate, QuestionTemplateSchema } from '../types/template.types';
import rawTemplates from '../templates/aptitude.templates.json';

export class TemplateLoader {
  private templates: Map<string, QuestionTemplate> = new Map();

  constructor() {
    this.loadTemplates();
  }

  /**
   * Loads templates from the raw JSON file and validates them against the Zod schema.
   */
  private loadTemplates(): void {
    const list = rawTemplates as unknown[];
    for (const rawItem of list) {
      const parsed = QuestionTemplateSchema.safeParse(rawItem);
      if (!parsed.success) {
        throw new Error(
          `Template configuration validation failed: ${parsed.error.errors
            .map((e) => `${e.path.join('.')}: ${e.message}`)
            .join(', ')}`
        );
      }
      const template = parsed.data;
      this.templates.set(template.templateId, template);
    }
  }

  /**
   * Fetches a template by its unique ID.
   */
  getTemplate(templateId: string): QuestionTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Filters and returns all templates for a specific topic.
   */
  getTemplatesByTopic(topic: string): QuestionTemplate[] {
    return Array.from(this.templates.values()).filter((t) => t.topic === topic);
  }

  /**
   * Returns all loaded templates.
   */
  getAllTemplates(): QuestionTemplate[] {
    return Array.from(this.templates.values());
  }
}
