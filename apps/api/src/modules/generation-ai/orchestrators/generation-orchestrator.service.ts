import { Injectable, Inject } from "@nestjs/common";
import { PromptManagerService } from "../prompts/prompt-manager.service";
import { TemplateLibraryService } from "../templates/template-library.service";
import { LLMAdapter } from "../adapters/llm-adapter.interface";
import { ResponseParserService } from "../validators/response-parser.service";
import { TopicAlignmentService } from "../validators/topic-alignment.service";
import { DifficultyValidatorService } from "../validators/difficulty-validator.service";
import { DuplicateDetectorService } from "../validators/duplicate-detector.service";
import { QuestionQualityService } from "../scorers/question-quality.service";
import { ReviewQueueIntegration } from "../integrations/review-queue.integration";
import { GeneratedQuestionDto } from "../dto/generated-question.dto";
import { GenerationRetryService } from "../retry/generation-retry.service";

@Injectable()
export class GenerationOrchestratorService {
  constructor(
    private readonly promptManager: PromptManagerService,
    private readonly templateLibrary: TemplateLibraryService,
    @Inject("LLM_ADAPTER") private readonly llmAdapter: LLMAdapter,
    private readonly responseParser: ResponseParserService,
    private readonly topicValidator: TopicAlignmentService,
    private readonly difficultyValidator: DifficultyValidatorService,
    private readonly duplicateDetector: DuplicateDetectorService,
    private readonly qualityScorer: QuestionQualityService,
    private readonly reviewQueueIntegration: ReviewQueueIntegration,
    private readonly retryService: GenerationRetryService,
  ) {}

  async generateQuestions(params: {
    topic: string;
    count: number;
    category?: string;
    difficulty?: string;
  }): Promise<{ questions: any[]; failures: string[] }> {
    const category = params.category || "Quantitative Aptitude";
    const difficulty = params.difficulty || "Medium";
    const count = params.count || 10;

    let promptTemplate = "";
    try {
      const activePrompt = await this.promptManager.getPromptByName(category);
      promptTemplate = activePrompt.content;
    } catch {
      promptTemplate = `Generate one ${category} question.
Difficulty: {difficulty}.
Topic: {topic}.
Provide: Question, Correct Answer, Explanation.`;
    }

    let templateSchema = {};
    const templateCategory = category.toLowerCase().includes("coding")
      ? "Coding"
      : "MCQ";
    try {
      const activeTemplate =
        await this.templateLibrary.getTemplateByCategory(templateCategory);
      templateSchema = activeTemplate.schema || {};
    } catch {
      templateSchema = {
        question: "string",
        answer: "string",
        explanation: "string",
        difficulty: "string",
        topic: "string",
        options: ["string"],
      };
    }

    const generatedQuestions: any[] = [];
    const failures: string[] = [];

    const batchSize = 10;
    for (let i = 0; i < count; i += batchSize) {
      const chunkCount = Math.min(batchSize, count - i);
      const promises = Array.from({ length: chunkCount }).map(async () => {
        try {
          const result = await this.retryService.generateWithRetry(
            category,
            params.topic,
            difficulty,
            3,
          );

          if (result.success && result.question) {
            const reviewRes =
              await this.reviewQueueIntegration.sendToReviewQueue(
                result.question,
              );
            return { success: true, data: reviewRes.question };
          } else {
            return {
              success: false,
              error: result.errors?.join("; ") || "Generation failed",
            };
          }
        } catch (e: any) {
          return { success: false, error: e.message || String(e) };
        }
      });

      const chunkResults = await Promise.all(promises);
      for (const res of chunkResults) {
        if (res.success && res.data) {
          const candidateText = (res.data.questionText || "")
            .trim()
            .toLowerCase();
          const isBatchDuplicate = generatedQuestions.some((eq) => {
            const eqText = (eq.questionText || "").trim().toLowerCase();
            if (eqText === candidateText) return true;
            const tokenize = (text: string) =>
              new Set(text.toLowerCase().split(/\W+/).filter(Boolean));
            const setA = tokenize(candidateText);
            const setB = tokenize(eqText);
            if (setA.size === 0 && setB.size === 0) return true;
            let intersection = 0;
            for (const item of setA) {
              if (setB.has(item)) intersection++;
            }
            const union = setA.size + setB.size - intersection;
            return intersection / union > 0.85;
          });

          if (isBatchDuplicate) {
            failures.push(
              "Batch duplicate detected: Question similar to another in same batch run.",
            );
          } else {
            generatedQuestions.push(res.data);
          }
        } else {
          failures.push(res.error || "Unknown error during chunk generation");
        }
      }
    }

    return {
      questions: generatedQuestions,
      failures,
    };
  }
}
