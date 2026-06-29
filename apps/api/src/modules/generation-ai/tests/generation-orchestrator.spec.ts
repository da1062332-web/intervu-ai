import { GenerationOrchestratorService } from "../orchestrators/generation-orchestrator.service";
import { PromptManagerService } from "../prompts/prompt-manager.service";
import { TemplateLibraryService } from "../templates/template-library.service";
import { LLMAdapter } from "../adapters/llm-adapter.interface";
import { ResponseParserService } from "../validators/response-parser.service";
import { TopicAlignmentService } from "../validators/topic-alignment.service";
import { DifficultyValidatorService } from "../validators/difficulty-validator.service";
import { DuplicateDetectorService } from "../validators/duplicate-detector.service";
import { QuestionQualityService } from "../scorers/question-quality.service";
import { ReviewQueueIntegration } from "../integrations/review-queue.integration";

describe("GenerationOrchestratorService", () => {
  let service: GenerationOrchestratorService;
  let promptManager: jest.Mocked<PromptManagerService>;
  let templateLibrary: jest.Mocked<TemplateLibraryService>;
  let llmAdapter: jest.Mocked<LLMAdapter>;
  let responseParser: jest.Mocked<ResponseParserService>;
  let topicValidator: jest.Mocked<TopicAlignmentService>;
  let difficultyValidator: jest.Mocked<DifficultyValidatorService>;
  let duplicateDetector: jest.Mocked<DuplicateDetectorService>;
  let qualityScorer: jest.Mocked<QuestionQualityService>;
  let reviewQueueIntegration: jest.Mocked<ReviewQueueIntegration>;

  beforeEach(() => {
    promptManager = {
      getPromptByName: jest.fn(),
    } as any;
    templateLibrary = {
      getTemplateByCategory: jest.fn(),
    } as any;
    llmAdapter = {
      generate: jest.fn(),
    };
    responseParser = {
      parse: jest.fn(),
    } as any;
    topicValidator = {
      validate: jest.fn(),
    } as any;
    difficultyValidator = {
      validate: jest.fn(),
    } as any;
    duplicateDetector = {
      checkDuplicate: jest.fn(),
    } as any;
    qualityScorer = {
      score: jest.fn(),
    } as any;
    reviewQueueIntegration = {
      sendToReviewQueue: jest.fn(),
    } as any;

    service = new GenerationOrchestratorService(
      promptManager,
      templateLibrary,
      llmAdapter,
      responseParser,
      topicValidator,
      difficultyValidator,
      duplicateDetector,
      qualityScorer,
      reviewQueueIntegration,
    );
  });

  it("should orchestrate prompt, template, llm, validation and queueing", async () => {
    promptManager.getPromptByName.mockResolvedValue({ content: "prompt template" } as any);
    templateLibrary.getTemplateByCategory.mockResolvedValue({ schema: {} } as any);
    llmAdapter.generate.mockResolvedValue("raw response");
    responseParser.parse.mockResolvedValue({
      question: "Q1 text is long enough",
      answer: "A1",
      explanation: "E1",
      difficulty: "Medium",
      topic: "Percentages",
    });
    topicValidator.validate.mockResolvedValue({ match: true, confidence: 1.0 });
    difficultyValidator.validate.mockResolvedValue(true);
    duplicateDetector.checkDuplicate.mockResolvedValue({ duplicate: false, similarity: 0 });
    qualityScorer.score.mockResolvedValue({ status: "PASS", score: 90, reasons: [] });
    reviewQueueIntegration.sendToReviewQueue.mockResolvedValue({ question: { id: "q1" } } as any);

    const result = await service.generateQuestions({
      topic: "Percentages",
      count: 1,
      category: "Quantitative Aptitude",
      difficulty: "Medium",
    });

    expect(result.questions).toHaveLength(1);
    expect(result.failures).toHaveLength(0);
    expect(reviewQueueIntegration.sendToReviewQueue).toHaveBeenCalled();
  });
});
