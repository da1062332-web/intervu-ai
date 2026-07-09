import { describe, it, expect, beforeAll, afterAll } from "vitest";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
import { PrismaService } from "../../src/prisma/prisma.service";
import { SolutionTemplateService } from "../../src/modules/template-library/services/solution-template.service";
import { TemplateRepository } from "../../src/modules/template-library/repositories/template.repository";
import { SolutionTemplateRepository } from "../../src/modules/template-library/repositories/solution-template.repository";
import { TemplatePreviewRepository } from "../../src/modules/template-library/repositories/template-preview.repository";
import { TemplateRendererService } from "../../src/modules/template-library/services/template-renderer.service";
import { PlaceholderValidatorService } from "../../src/modules/template-library/services/placeholder-validator.service";
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

describe("Preview Generation Integration Test", () => {
  let prisma: PrismaService;
  let templateRepo: TemplateRepository;
  let solutionTemplateRepo: SolutionTemplateRepository;
  let templatePreviewRepo: TemplatePreviewRepository;
  let solutionTemplateService: SolutionTemplateService;

  let testTemplateId: string;

  beforeAll(async () => {
    prisma = new PrismaService();
    templateRepo = new TemplateRepository(prisma);
    solutionTemplateRepo = new SolutionTemplateRepository(prisma);
    templatePreviewRepo = new TemplatePreviewRepository(prisma);

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

    solutionTemplateService = new SolutionTemplateService(
      prisma,
      solutionTemplateRepo,
      templatePreviewRepo,
      templateRepo,
      new TemplateRendererService(),
      new PlaceholderValidatorService(),
      retryService,
    );

    // Seed dummy template
    const template = await prisma.template.create({
      data: {
        name: "Preview Test Template",
        difficulty: DifficultyLevel.MEDIUM,
        difficultyLevel: DifficultyLevel.MEDIUM,
        conceptKey: "preview-test",
        questionType: "mcq",
        structure: { questionTemplate: "What is sum of {a} and {b}?" },
        variableSchema: {
          variables: [
            { name: "a", type: "number", min: 1, max: 10 },
            { name: "b", type: "number", min: 1, max: 10 },
          ],
        },
        constraints: { constraints: [] },
        solutionSchema: {
          steps: ["Step 1: add variables"],
          finalAnswer: "a + b",
        },
      },
    });
    testTemplateId = template.id;

    // Seed variable relationships
    await prisma.templateVariable.create({
      data: {
        templateId: testTemplateId,
        variableName: "a",
        variableType: "NUMBER",
        required: true,
      },
    });
    await prisma.templateVariable.create({
      data: {
        templateId: testTemplateId,
        variableName: "b",
        variableType: "NUMBER",
        required: true,
      },
    });
  });

  afterAll(async () => {
    if (testTemplateId) {
      await prisma.template
        .delete({ where: { id: testTemplateId } })
        .catch(() => {});
    }
    await prisma.$disconnect();
  });

  it("should successfully generate an AI preview for the template", async () => {
    const preview = await solutionTemplateService.generatePreview(
      testTemplateId,
      {
        previewPayload: { a: 5, b: 7 },
      },
    );

    expect(preview).toBeDefined();
    expect(preview.previewPayload).toEqual({ a: 5, b: 7 });
    expect(preview.previewResult).toBeDefined();

    const result = preview.previewResult as any;
    expect(result.questionText).toContain("Mock question about preview-test");
    expect(result.options.length).toBe(4);
    expect(result.correctAnswer).toContain("Mock Answer");
    expect(result.explanation).toContain("Step-by-Step Solution");
    expect(result.validation.valid).toBe(true);
  });
});
