import { vi, describe, it, expect, beforeAll, afterAll } from "vitest";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
import { PrismaService } from "../../src/prisma/prisma.service";
import { GenerationOrchestratorService } from "../../src/modules/generation-ai/orchestrators/generation-orchestrator.service";
import { PromptBuilderService } from "../../src/modules/generation-ai/prompts/prompt-builder.service";
import { QuestionGeneratorService } from "../../src/modules/generation-ai/generators/question-generator.service";
import { OptionGeneratorService } from "../../src/modules/generation-ai/generators/option-generator.service";
import { ExplanationGeneratorService } from "../../src/modules/generation-ai/generators/explanation-generator.service";
import { ResponseValidatorService } from "../../src/modules/generation-ai/validators/response-validator.service";
import { GenerationAuditService } from "../../src/modules/generation-ai/services/generation-audit.service";
import { GenerationRetryService } from "../../src/modules/generation-ai/retry/generation-retry.service";
import { PromptManagerService } from "../../src/modules/generation-ai/prompts/prompt-manager.service";
import { TemplateLibraryService } from "../../src/modules/generation-ai/templates/template-library.service";
import { ResponseParserService } from "../../src/modules/generation-ai/validators/response-parser.service";
import { TopicAlignmentService } from "../../src/modules/generation-ai/validators/topic-alignment.service";
import { DifficultyValidatorService } from "../../src/modules/generation-ai/validators/difficulty-validator.service";
import { DuplicateDetectorService } from "../../src/modules/generation-ai/validators/duplicate-detector.service";
import { QuestionQualityService } from "../../src/modules/generation-ai/scorers/question-quality.service";
import { ReviewQueueIntegration } from "../../src/modules/generation-ai/integrations/review-queue.integration";
import { MockAdapter } from "../../src/modules/generation-ai/adapters/mock.adapter";
import { ParameterGeneratorService } from "../../src/modules/generation/services/parameter-generator.service";
import { DifficultyLevel } from "@prisma/client";

describe("E2E AI Generation Pipeline Integration Test", () => {
  let prisma: PrismaService;
  let orchestrator: GenerationOrchestratorService;
  let testTemplateId: string;

  beforeAll(async () => {
    prisma = new PrismaService();

    const promptBuilder = new PromptBuilderService();
    const mockLlm = new MockAdapter();
    const questionGenerator = new QuestionGeneratorService(mockLlm);
    const optionGenerator = new OptionGeneratorService();
    const explanationGenerator = new ExplanationGeneratorService();
    const responseValidator = new ResponseValidatorService();
    const auditService = new GenerationAuditService(prisma);

    const topicValidator = new TopicAlignmentService();
    const difficultyValidator = new DifficultyValidatorService();
    const duplicateDetector = new DuplicateDetectorService(prisma);
    const qualityScorer = new QuestionQualityService(
      topicValidator,
      difficultyValidator,
    );

    const retryService = new GenerationRetryService(
      prisma,
      promptBuilder,
      questionGenerator,
      optionGenerator,
      explanationGenerator,
      responseValidator,
      auditService,
      duplicateDetector,
      qualityScorer,
      new ParameterGeneratorService(),
      {} as any,
      {} as any,
    );

    const promptManager = new PromptManagerService(prisma);
    const templateLibrary = new TemplateLibraryService(prisma);
    const responseParser = new ResponseParserService();
    const reviewQueueIntegration = {
      sendToReviewQueue: vi.fn().mockImplementation(async (q) => {
        return {
          question: {
            id: "q-1",
            questionText: q.question,
            options: q.options || [],
            correctAnswer: q.correctAnswer,
          },
        };
      }),
    } as any;

    orchestrator = new GenerationOrchestratorService(
      promptManager,
      templateLibrary,
      mockLlm,
      responseParser,
      topicValidator,
      difficultyValidator,
      duplicateDetector,
      qualityScorer,
      reviewQueueIntegration,
      retryService,
    );

    // Seed dummy template
    const template = await prisma.template.create({
      data: {
        name: "E2E Pipeline Test Template",
        difficulty: DifficultyLevel.MEDIUM,
        difficultyLevel: DifficultyLevel.MEDIUM,
        conceptKey: "pipeline-test",
        questionType: "mcq",
        structure: { questionTemplate: "E2E template question about {topic}" },
        variableSchema: { variables: [] },
        constraints: { constraints: [] },
        solutionSchema: {
          steps: ["Perform check"],
          finalAnswer: "success",
        },
      },
    });
    testTemplateId = template.id;
  });

  afterAll(async () => {
    if (testTemplateId) {
      await prisma.template
        .delete({ where: { id: testTemplateId } })
        .catch(() => {});
    }
    await prisma.$disconnect();
  });

  it("should generate a batch of questions end-to-end successfully", async () => {
    const result = await orchestrator.generateQuestions({
      topic: "pipeline-test",
      count: 2,
      category: "quantitative",
      difficulty: "Medium",
    });

    expect(result.failures.length).toBe(0);
    expect(result.questions.length).toBe(2);

    const q = result.questions[0];
    expect(q.id).toBeDefined();
    expect(q.questionText).toContain("Mock question about pipeline-test");
    expect(q.options.length).toBe(4);
    expect(q.correctAnswer).toContain("Mock Answer");
  });
});
