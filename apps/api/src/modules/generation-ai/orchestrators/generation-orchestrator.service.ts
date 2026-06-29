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
    const templateCategory = category.toLowerCase().includes("coding") ? "Coding" : "MCQ";
    try {
      const activeTemplate = await this.templateLibrary.getTemplateByCategory(templateCategory);
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
        let attempts = 0;
        const maxAttempts = 3;
        while (attempts < maxAttempts) {
          attempts++;
          try {
            const finalPrompt = `
Category: ${category}
Topic: ${params.topic}
Difficulty: ${difficulty}

${promptTemplate}

You MUST return your response in the following JSON format matching this schema:
${JSON.stringify(templateSchema, null, 2)}

Ensure there are no leading or trailing markdown blocks (like \`\`\`json). The output must be raw JSON parsable.
`;

            const rawResponse = await this.llmAdapter.generate(finalPrompt);
            const parsed = await this.responseParser.parse(rawResponse);

            if (!parsed.topic) parsed.topic = params.topic;
            if (!parsed.difficulty) parsed.difficulty = difficulty;

            // Normalize options if missing (MCQ templates should generate options, but fallback just in case)
            if (!(parsed as any).options) {
              (parsed as any).options = [parsed.answer, "Incorrect A", "Incorrect B", "Incorrect C"];
            }

            const topicRes = await this.topicValidator.validate(parsed, params.topic);
            const diffRes = await this.difficultyValidator.validate(parsed, difficulty);
            const dupRes = await this.duplicateDetector.checkDuplicate(parsed);
            const qualityRes = await this.qualityScorer.score(parsed, params.topic, difficulty);

            const isValid = topicRes.match && diffRes && !dupRes.duplicate && qualityRes.status === "PASS";

            if (isValid) {
              const reviewRes = await this.reviewQueueIntegration.sendToReviewQueue(parsed);
              return { success: true, data: reviewRes.question };
            } else {
              let reason = "";
              if (!topicRes.match) reason += "Topic mismatch. ";
              if (!diffRes) reason += "Difficulty mismatch. ";
              if (dupRes.duplicate) reason += "Duplicate detected. ";
              if (qualityRes.status === "FAIL") reason += `Quality check failed: ${qualityRes.reasons.join(", ")}`;
              throw new Error(reason || "Validation failed");
            }
          } catch (e: any) {
            if (attempts >= maxAttempts) {
              return { success: false, error: e.message };
            }
          }
        }
        return { success: false, error: "Max attempts reached" };
      });

      const chunkResults = await Promise.all(promises);
      for (const res of chunkResults) {
        if (res.success && res.data) {
          generatedQuestions.push(res.data);
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
