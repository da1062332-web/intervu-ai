import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import { Test, TestingModule } from "@nestjs/testing";
import {
  INestApplication,
  Injectable,
  CanActivate,
  ExecutionContext,
} from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { StyleProfileController } from "../../src/modules/blueprint/controllers/style-profile.controller";
import { BlueprintController } from "../../src/modules/blueprint/controllers/blueprint.controller";
import { QuestionGenerationController } from "../../src/modules/generation/controllers/question-generation.controller";
import { StyleProfileService } from "../../src/modules/blueprint/services/style-profile.service";
import { BlueprintService } from "../../src/modules/blueprint/services/blueprint.service";
import { StyleValidationService } from "../../src/modules/question-generation/services/style-validation.service";
import { PromptBuilderService } from "../../src/modules/generation-ai/prompts/prompt-builder.service";
import { GenerationStrategyResolver } from "../../src/modules/generation/services/generation-strategy.resolver";
import { ResponseValidatorService } from "../../src/modules/generation-ai/validators/response-validator.service";
import { GenerationRetryService } from "../../src/modules/generation-ai/retry/generation-retry.service";
import { ValidationRegistry } from "../../src/modules/question-generation/registry/validation.registry";
import { QuestionAssemblerService } from "../../src/modules/question-generation/assembler/question-assembler.service";
import { QuestionRepository } from "../../src/modules/question-generation/repository/question.repository";
import { GenerationTrackingService } from "../../src/modules/question-generation/services/generation-tracking.service";
import { StyleProfileRepository } from "../../src/modules/blueprint/repositories/style-profile.repository";
import { BlueprintRepository } from "../../src/modules/blueprint/repositories/blueprint.repository";
import { TopicRegistryLoader } from "../../src/modules/concept-mapping/services/topic-registry-loader.service";
import { TemplateRepository } from "../../src/modules/template-library/repositories/template.repository";
import { PrismaService } from "../../src/prisma/prisma.service";
import { RolesGuard } from "../../src/modules/auth/guards/roles.guard";
import { JwtAuthGuard } from "../../src/modules/auth/guards/jwt-auth.guard";
import { PromptTemplateRegistry } from "../../src/modules/question-generation/registry/prompt-template.registry";
import { BlueprintCompilerService } from "../../src/modules/blueprint/services/blueprint-compiler.service";
import { UserRole, GenerationStrategy } from "@prisma/client";
import { ZodValidationPipe } from "@intervu/shared";

@Injectable()
class DynamicAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = {
      id: "test-user-id",
      email: "test@intervu.ai",
      role: UserRole.ADMIN,
    };
    console.log("DynamicAuthGuard.canActivate called, user set:", req.user);
    return true;
  }
}

describe("E2E Style Profile & Question Generation Integration Flow", () => {
  let app: INestApplication;
  let mockPrisma: any;
  let mockStrategyResolver: any;
  let mockValidationRegistry: any;
  let mockQuestionRepo: any;
  let mockTrackingService: any;
  let mockTopicRegistryLoader: any;
  let mockTemplateRepository: any;

  const mockStyleProfile = {
    id: "style-profile-e2e-id",
    name: "E2E Assessment Profile",
    profileType: "campus",
    description: "Assessment profile for E2E tests",
    active: true,
    status: "ACTIVE",
    isDefault: false,
    languageStyle: {
      language: "English",
      sentenceLength: "short",
      vocabularyLevel: "basic",
      grammarStyle: "formal",
    },
    contextStyle: {
      preferredContexts: ["Daily Life", "Education"],
    },
    difficultyStyle: {
      easy: ["Short", "Direct"],
      medium: ["Moderate wording"],
      hard: ["Interpretive"],
    },
    distractorRules: {
      exactlyFourOptions: true,
      oneCorrectAnswer: true,
      plausibleIncorrectOptions: true,
      avoidObviouslyWrongOptions: true,
      avoidHumorousOptions: true,
      representCommonStudentMistakes: true,
    },
    explanationStyle: {
      formulaFirst: true,
      stepWiseSolution: true,
      maxSteps: 4,
      explanationLength: "short",
      highlightFinalAnswer: true,
    },
    aiInstructions: "Use basic terms.",
  };

  const mockBlueprint = {
    id: "blueprint-e2e-id",
    configId: "exam-config-e2e-id",
    styleProfileId: "style-profile-e2e-id",
    sections: [
      {
        sectionId: "E2E_QA_SECTION",
        questionCount: 5,
        difficultyAllocation: { easy: 40, medium: 60, hard: 0 },
        topicAllocations: [{ topicId: "topic-1", percentage: 100 }],
      },
    ],
  };

  beforeAll(async () => {
    mockPrisma = {
      styleProfile: {
        findFirst: vi.fn().mockResolvedValue(mockStyleProfile),
        findUnique: vi.fn().mockResolvedValue(mockStyleProfile),
        create: vi.fn().mockResolvedValue(mockStyleProfile),
        update: vi.fn().mockResolvedValue(mockStyleProfile),
        delete: vi.fn().mockResolvedValue(mockStyleProfile),
      },
      blueprint: {
        findFirst: vi.fn().mockResolvedValue(mockBlueprint),
        findUnique: vi.fn().mockResolvedValue(mockBlueprint),
        create: vi.fn().mockResolvedValue(mockBlueprint),
        update: vi.fn().mockResolvedValue(mockBlueprint),
      },
      template: {
        findUnique: vi.fn().mockResolvedValue({
          id: "template-e2e-id",
          name: "E2E Template",
          description: "E2E template description",
          conceptKey: "Concept 1",
          difficultyLevel: "EASY",
          questionType: "MCQ",
          structure: {},
          variableSchema: {},
          constraints: {},
          solutionSchema: {},
          generationStrategy: GenerationStrategy.VARIABLE,
          version: 1,
        }),
      },
      templateDatasetConfig: {
        findUnique: vi.fn().mockResolvedValue({
          datasetId: "dataset-e2e-id",
          templateId: "template-e2e-id",
          variableMapping: {},
        }),
      },
      topic: {
        findFirst: vi
          .fn()
          .mockResolvedValue({ id: "topic-1", code: "Concept 1" }),
      },
      sectionTopic: {
        findFirst: vi.fn().mockResolvedValue({ sectionId: "E2E_QA_SECTION" }),
      },
      examSection: {
        findFirst: vi.fn().mockResolvedValue({ id: "E2E_QA_SECTION" }),
      },
      question: {
        create: vi.fn().mockResolvedValue({
          id: "q-saved-id",
          metadata: { styleProfileSnapshot: mockStyleProfile },
          questionText: "What is 10% of 100?",
          answer: "10",
          explanation: "Explanation",
          topicId: "topic-1",
          sectionId: "E2E_QA_SECTION",
          difficulty: "EASY",
          source: "GENERATED",
          templateId: "template-e2e-id",
          version: 1,
          status: "ACTIVE",
        }),
      },
    };

    mockStrategyResolver = {
      resolve: vi.fn().mockResolvedValue({
        strategy: GenerationStrategy.VARIABLE,
        payload: {
          variables: { a: 10, b: 100 },
          derivedVariables: {},
          hydratedQuestion: "What is 10% of 100?",
        },
        metadata: {
          difficulty: "easy",
          templateId: "template-e2e-id",
        },
      }),
    };

    mockValidationRegistry = {
      resolve: vi.fn().mockReturnValue({
        validate: vi
          .fn()
          .mockResolvedValue({ valid: true, errors: [], warnings: [] }),
      }),
    };

    mockQuestionRepo = {
      save: vi
        .fn()
        .mockImplementation((question) =>
          Promise.resolve({ id: "q-saved-id", ...question }),
        ),
    };

    mockTrackingService = {
      createJob: vi.fn(),
      logEvent: vi.fn(),
    };

    mockTopicRegistryLoader = {
      getTopicById: vi.fn().mockResolvedValue({
        id: "topic-1",
        topic: "Topic 1",
        concepts: ["Concept 1"],
      }),
    };

    mockTemplateRepository = {
      findAll: vi.fn().mockResolvedValue([
        {
          id: "template-e2e-id",
          isActive: true,
          difficultyLevel: "EASY",
          conceptKey: "Concept 1",
        },
        {
          id: "template-e2e-medium-id",
          isActive: true,
          difficultyLevel: "MEDIUM",
          conceptKey: "Concept 1",
        },
      ]),
    };

    const mockPromptTemplateRegistry = {
      resolve: vi
        .fn()
        .mockReturnValue(
          "You are an expert. {{variables}} {{hydratedQuestion}}",
        ),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        StyleProfileController,
        BlueprintController,
        QuestionGenerationController,
      ],
      providers: [
        StyleProfileService,
        BlueprintService,
        StyleValidationService,
        PromptBuilderService,
        QuestionAssemblerService,
        StyleProfileRepository,
        BlueprintRepository,
        { provide: BlueprintCompilerService, useValue: {} },
        {
          provide: PromptTemplateRegistry,
          useValue: mockPromptTemplateRegistry,
        },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: GenerationStrategyResolver, useValue: mockStrategyResolver },
        {
          provide: ResponseValidatorService,
          useValue: { validate: vi.fn().mockReturnValue(undefined) },
        },
        {
          provide: GenerationRetryService,
          useValue: {
            generateFromTemplate: vi.fn().mockResolvedValue({
              success: true,
              question: {
                question: "What is 10% of 100?",
                correctAnswer: "10",
                explanation:
                  "Concept: Percentages. Formula / Reasoning: 10% of 100 = 10. Step-by-Step Solution: Multiply 100 by 0.10. Final Answer: 10.",
                options: ["10", "20", "30", "40"],
              },
              errors: [],
            }),
          },
        },
        { provide: ValidationRegistry, useValue: mockValidationRegistry },
        { provide: QuestionRepository, useValue: mockQuestionRepo },
        { provide: GenerationTrackingService, useValue: mockTrackingService },
        { provide: TopicRegistryLoader, useValue: mockTopicRegistryLoader },
        { provide: TemplateRepository, useValue: mockTemplateRepository },
        { provide: APP_GUARD, useClass: DynamicAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ZodValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("completes the full E2E style profile -> blueprint -> generation -> validation -> save flow", async () => {
    // 1. Create Style Profile via API
    const styleProfileRes = await request(app.getHttpServer())
      .post("/admin/style-profiles")
      .send({
        name: "E2E Assessment Profile",
        languageStyle: {
          language: "English",
          sentenceLength: "short",
          vocabularyLevel: "basic",
          grammarStyle: "formal",
        },
      });

    if (styleProfileRes.status !== 201) {
      console.log(
        "Create Style Profile failed:",
        JSON.stringify(styleProfileRes.body, null, 2),
      );
    }
    expect(styleProfileRes.status).toBe(201);
    expect(styleProfileRes.body.success).toBe(true);

    // 2. Assign Style Profile to Blueprint
    const blueprintRes = await request(app.getHttpServer())
      .post("/blueprints")
      .send({
        configId: "exam-config-e2e-id",
        styleProfileId: "style-profile-e2e-id",
        sections: [
          {
            sectionId: "E2E_QA_SECTION",
            questionCount: 5,
            difficultyAllocation: { easy: 40, medium: 60, hard: 0 },
            topicAllocations: [{ topicId: "topic-1", percentage: 100 }],
          },
        ],
      });

    if (blueprintRes.status !== 201) {
      console.log(
        "Create Blueprint failed:",
        JSON.stringify(blueprintRes.body, null, 2),
      );
    }
    expect(blueprintRes.status).toBe(201);
    expect(blueprintRes.body.success).toBe(true);

    // 3. Trigger Question Generation with the blueprint options
    const generationRes = await request(app.getHttpServer())
      .post("/question-generation/generate")
      .send({
        templateId: "template-e2e-id",
        options: {
          blueprintId: "blueprint-e2e-id",
        },
      });

    expect(generationRes.status).toBe(201);
    expect(generationRes.body.questions).toBeDefined();
    expect(Array.isArray(generationRes.body.questions)).toBe(true);
    expect(generationRes.body.questions.length).toBeGreaterThan(0);

    // Verify style profile snapshot was saved in question metadata
    const question = generationRes.body.questions[0];
    expect(question.metadata.styleProfileSnapshot).toBeDefined();
    expect(question.metadata.styleProfileSnapshot.name).toBe(
      "E2E Assessment Profile",
    );

    // Verify E2E style validation passed
    expect(generationRes.body.validationReport.valid).toBe(true);
  });
});
