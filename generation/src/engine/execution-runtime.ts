import { TemplateLoader } from './template-loader';
import { executeTemplate, GeneratedOutput } from './template-executor';

export class AptitudeGenerationRuntime {
  private loader: TemplateLoader;

  constructor(loader?: TemplateLoader) {
    this.loader = loader || new TemplateLoader();
  }

  /**
   * Generates a single question for a template ID.
   */
  generateQuestion(
    templateId: string,
    seed: number,
    seenHashes: Set<string> | string[] = new Set()
  ): GeneratedOutput {
    const template = this.loader.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    return executeTemplate(template, seed, seenHashes);
  }

  /**
   * Generates multiple unique, validated questions for a specific topic,
   * dynamically switching between templates for that topic and checking for collisions.
   */
  generateQuestionsForTopic(
    topic: string,
    count: number,
    startSeed: number,
    seenHashes: Set<string> = new Set()
  ): GeneratedOutput[] {
    const templates = this.loader.getTemplatesByTopic(topic);
    if (templates.length === 0) {
      throw new Error(`No templates found for topic: ${topic}`);
    }

    const results: GeneratedOutput[] = [];
    let currentSeed = startSeed;
    let attempts = 0;
    const maxGlobalAttempts = count * 20; // Prevent infinite loops

    while (results.length < count && attempts < maxGlobalAttempts) {
      attempts++;
      // Determine which template to run based on the seed
      const templateIdx = (currentSeed + attempts) % templates.length;
      const template = templates[templateIdx];

      try {
        const question = executeTemplate(template, currentSeed + attempts, seenHashes);
        
        // Add the newly generated question's hash to the validation register to prevent subsequent duplicates
        seenHashes.add(question.hash);
        results.push(question);
      } catch {
        // Skip failed attempts (e.g. constraints could not be satisfied, or hash collisions occurred)
        continue;
      }
    }

    if (results.length < count) {
      throw new Error(
        `Could only generate ${results.length} unique questions out of requested ${count} for topic: ${topic}`
      );
    }

    return results;
  }
}
