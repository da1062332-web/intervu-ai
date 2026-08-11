import { describe, it, expect, beforeAll, afterAll } from "vitest";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
import { PrismaService } from "../../src/prisma/prisma.service";
import { GenerationRetryService } from "../../src/modules/generation-ai/retry/generation-retry.service";
import { PromptBuilderService } from "../../src/modules/generation-ai/prompts/prompt-builder.service";
import { QuestionGeneratorService } from "../../src/modules/generation-ai/generators/question-generator.service";
import { OptionGeneratorService } from "../../src/modules/generation-ai/generators/option-generator.service";
import { ExplanationGeneratorService } from "../../src/modules/generation-ai/generators/explanation-generator.service";
import { ResponseValidatorService } from "../../src/modules/generation-ai/validators/response-validator.service";
import { GenerationAuditService } from "../../src/modules/generation-ai/services/generation-audit.service";
import { MockAdapter } from "../../src/modules/generation-ai/adapters/mock.adapter";
import { ParameterGeneratorService } from "../../src/modules/generation/services/parameter-generator.service";
import { DuplicateDetectorService } from "../../src/modules/generation-ai/validators/duplicate-detector.service";
import { QuestionQualityService } from "../../src/modules/generation-ai/scorers/question-quality.service";
import { TopicAlignmentService } from "../../src/modules/generation-ai/validators/topic-alignment.service";
import { DifficultyValidatorService } from "../../src/modules/generation-ai/validators/difficulty-validator.service";
import { DifficultyLevel } from "@prisma/client";

describe("Question Generation Integration Test", () => {
  let prisma: PrismaService;
  let retryService: GenerationRetryService;
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

    retryService = new GenerationRetryService(
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

    // Seed dummy template
    const template = await prisma.template.create({
      data: {
        name: "Question Test Template",
        difficulty: DifficultyLevel.MEDIUM,
        difficultyLevel: DifficultyLevel.MEDIUM,
        conceptKey: "q-gen-test",
        questionType: "mcq",
        structure: { questionTemplate: "Evaluate {x} squared." },
        variableSchema: {
          variables: [{ name: "x", type: "number", min: 2, max: 5 }],
        },
        constraints: { constraints: [] },
        solutionSchema: {
          steps: ["Square x"],
          finalAnswer: "x * x",
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

  it("should successfully generate a question using category, topic and difficulty", async () => {
    const result = await retryService.generateWithRetry(
      "quantitative",
      "q-gen-test",
      "Medium",
      3,
    );

    expect(result.success).toBe(true);
    expect(result.attempts).toBeLessThanOrEqual(3);
    expect(result.question).toBeDefined();

    const q = result.question!;
    expect(q.question).toContain("Mock question about q-gen-test");
    expect(q.options).toBeDefined();
    expect(q.options!.length).toBe(4);
    expect(q.correctAnswer).toContain("Mock Answer");
  }, 15000);
});
