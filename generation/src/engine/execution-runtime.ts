import { TemplateLoader } from './template-loader';
import { executeTemplate, GeneratedOutput } from './template-executor';
import { MetricsTracker, ValidationFailureReason, TemplateMetadataContract } from './metrics-tracker';

export interface FailureLog {
  templateId: string;
  seed: number;
  reason: string;
  timestamp: number;
}

export interface PastQuestion {
  templateId: string;
  question: string;
  parameters: Record<string, unknown>;
}

export class AptitudeGenerationRuntime {
  private loader: TemplateLoader;
  private metricsTracker: MetricsTracker;
  private pastQuestions: PastQuestion[] = [];
  private failureLogs: FailureLog[] = [];

  constructor(loader?: TemplateLoader) {
    this.loader = loader || new TemplateLoader();
    this.metricsTracker = new MetricsTracker();
  }

  /**
   * Returns the underlying metrics tracker.
   */
  getMetricsTracker(): MetricsTracker {
    return this.metricsTracker;
  }

  /**
   * Logs a generation failure.
   */
  private logFailure(templateId: string, seed: number, reason: string): void {
    this.failureLogs.push({
      templateId,
      seed,
      reason,
      timestamp: Date.now(),
    });
  }

  /**
   * Retrieves all failure logs.
   */
  getFailureLogs(): FailureLog[] {
    return this.failureLogs;
  }

  /**
   * Returns structured analytics/metadata for a given template.
   */
  getTemplateMetadata(templateId: string): TemplateMetadataContract | null {
    const template = this.loader.getTemplate(templateId);
    if (!template) {
      return null;
    }
    return this.metricsTracker.getMetricsForTemplate(
      templateId,
      template.difficulty,
      template.topic,
      template.tags
    );
  }

  /**
   * Generates a single question for a template ID, implementing failure recovery and fallback template routing.
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

    const startTime = performance.now();
    const failures: { reason: ValidationFailureReason; count: number }[] = [];
    const tracker = {
      recordFailure: (reason: ValidationFailureReason) => {
        const found = failures.find((f) => f.reason === reason);
        if (found) {
          found.count++;
        } else {
          failures.push({ reason, count: 1 });
        }
      },
    };

    let success = false;
    let attemptsUsed = 0;

    // Filter past parameters for the same template
    const templatePastParams = this.pastQuestions
      .filter((q) => q.templateId === templateId)
      .map((q) => q.parameters);

    // Filter past question texts from other templates to run semantic similarity checks
    const otherPastTexts = this.pastQuestions
      .filter((q) => q.templateId !== templateId)
      .map((q) => q.question);

    try {
      const result = executeTemplate(template, seed, seenHashes, tracker, templatePastParams, otherPastTexts);
      success = true;
      attemptsUsed = failures.reduce((sum, f) => sum + f.count, 0) + 1;

      // Track history
      this.pastQuestions.push({
        templateId,
        question: result.question,
        parameters: result.parameters,
      });

      return result;
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this.logFailure(templateId, seed, reason);

      // Failure Recovery / Fallback Generation
      const fallbackTemplates = this.loader.getAllTemplates().filter(
        (t) => t.topic === template.topic && t.difficulty === template.difficulty && t.templateId !== templateId
      );

      for (const fallbackTemplate of fallbackTemplates) {
        const fallbackId = fallbackTemplate.templateId;
        const fallbackPastParams = this.pastQuestions
          .filter((q) => q.templateId === fallbackId)
          .map((q) => q.parameters);
        const fallbackOtherPastTexts = this.pastQuestions
          .filter((q) => q.templateId !== fallbackId)
          .map((q) => q.question);

        try {
          const result = executeTemplate(
            fallbackTemplate,
            seed + 100, // adjust seed to prevent collision
            seenHashes,
            tracker,
            fallbackPastParams,
            fallbackOtherPastTexts
          );
          success = true;
          attemptsUsed = failures.reduce((sum, f) => sum + f.count, 0) + 1;

          // Track fallback history
          this.pastQuestions.push({
            templateId: fallbackId,
            question: result.question,
            parameters: result.parameters,
          });

          return result;
        } catch (fallbackErr) {
          this.logFailure(fallbackId, seed + 100, fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr));
        }
      }

      attemptsUsed = failures.reduce((sum, f) => sum + f.count, 0);
      throw new Error(`Failure Recovery failed: both template ${templateId} and all of its fallbacks failed validation/generation`);
    } finally {
      const runtimeMs = performance.now() - startTime;
      this.metricsTracker.recordRun({
        templateId,
        success,
        runtimeMs,
        attemptsUsed,
        failures,
      });
    }
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
        const question = this.generateQuestion(template.templateId, currentSeed + attempts, seenHashes);

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
