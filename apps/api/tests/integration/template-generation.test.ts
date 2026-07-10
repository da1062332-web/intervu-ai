import { describe, it, expect, beforeAll, afterAll } from "vitest";
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
import { PrismaService } from "../../src/prisma/prisma.service";
import { TemplateRepository } from "../../src/modules/template-library/repositories/template.repository";
import { SolutionTemplateRepository } from "../../src/modules/template-library/repositories/solution-template.repository";
import { TemplatePreviewRepository } from "../../src/modules/template-library/repositories/template-preview.repository";
import { SolutionTemplateService } from "../../src/modules/template-library/services/solution-template.service";
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

describe("Template Generation Database Persistence Integration Test", () => {
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

    // Seed test template
    const template = await prisma.template.create({
      data: {
        name: "DB Persistence Test Template",
        difficulty: DifficultyLevel.HARD,
        difficultyLevel: DifficultyLevel.HARD,
        conceptKey: "db-persistence-test",
        questionType: "numeric",
        structure: { questionTemplate: "Solve numeric for {x}" },
        variableSchema: {
          variables: [{ name: "x", type: "number", min: 1, max: 10 }],
        },
        constraints: { constraints: [] },
        solutionSchema: {
          steps: ["Perform math operation"],
          finalAnswer: "x * 2",
        },
      },
    });
    testTemplateId = template.id;

    await prisma.templateVariable.create({
      data: {
        templateId: testTemplateId,
        variableName: "x",
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

  it("should successfully generate, persist, and retrieve a preview snapshot from database", async () => {
    const preview = await solutionTemplateService.generatePreview(
      testTemplateId,
      {
        previewPayload: { x: 4 },
      },
    );

    expect(preview).toBeDefined();
    expect(preview.id).toBeDefined();

    // Verify DB entry exists
    const dbPreview = await prisma.templatePreview.findUnique({
      where: { id: preview.id },
    });
    expect(dbPreview).toBeDefined();
    expect(dbPreview!.templateId).toBe(testTemplateId);

    const result = dbPreview!.previewResult as any;
    expect(result.questionText).toContain(
      "Mock question about db-persistence-test",
    );
    expect(result.options).toEqual([]);
    expect(result.correctAnswer).toContain("Mock Answer");
  });
});
