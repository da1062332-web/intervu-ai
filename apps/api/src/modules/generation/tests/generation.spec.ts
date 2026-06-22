import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { GenerationContextService } from "../services/generation-context.service";
import { TemplateSelectorService } from "../services/template-selector.service";
import { ParameterGeneratorService } from "../services/parameter-generator.service";
import { QuestionInstantiatorService } from "../services/question-instantiator.service";
import { QuestionValidationService } from "../services/question-validation.service";
import { GenerationOrchestratorService } from "../services/generation-orchestrator.service";
import { DifficultyLevel } from "@prisma/client";

describe("Test Generation Core (Module 2)", () => {
  let contextService: GenerationContextService;
  let selectorService: TemplateSelectorService;
  let parameterGenerator: ParameterGeneratorService;
  let instantiator: QuestionInstantiatorService;
  let validationService: QuestionValidationService;
  let orchestrator: GenerationOrchestratorService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      examConfig: {
        findUnique: jest.fn(),
      },
      template: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      concept: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      question: {
        groupBy: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      generatedQuestion: {
        create: jest.fn(),
      },
      validationLog: {
        create: jest.fn(),
      },
      generationLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prismaMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerationContextService,
        TemplateSelectorService,
        ParameterGeneratorService,
        QuestionInstantiatorService,
        QuestionValidationService,
        GenerationOrchestratorService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    contextService = module.get<GenerationContextService>(GenerationContextService);
    selectorService = module.get<TemplateSelectorService>(TemplateSelectorService);
    parameterGenerator = module.get<ParameterGeneratorService>(ParameterGeneratorService);
    instantiator = module.get<QuestionInstantiatorService>(QuestionInstantiatorService);
    validationService = module.get<QuestionValidationService>(QuestionValidationService);
    orchestrator = module.get<GenerationOrchestratorService>(GenerationOrchestratorService);
  });

  describe("1. GenerationContextService", () => {
    it("should load context successfully under valid configurations", async () => {
      const mockExamConfig = {
        id: "exam-123",
        name: "Backend Interview",
        role: "BACKEND",
        durationMinutes: 60,
        totalQuestions: 20,
        difficultyDistribution: {
          easyPercentage: 20,
          mediumPercentage: 50,
          hardPercentage: 30,
        },
        sections: [
          {
            id: "sec-1",
            name: "Coding",
            questionCount: 10,
            sectionDurationMinutes: 30,
            sectionOrder: 1,
            code: "coding",
            sectionTopics: [
              {
                topic: {
                  id: "topic-1",
                  status: "ACTIVE",
                  topicName: "Data Structures",
                  subtopic: "arrays",
                  concepts: [{ code: "array-concepts", status: "ACTIVE" }],
                },
                topicWeightage: { weightagePercentage: 100 },
              },
            ],
          },
        ],
      };

      prismaMock.examConfig.findUnique.mockResolvedValue(mockExamConfig);
      prismaMock.template.findMany.mockResolvedValue([
        {
          id: "temp-1",
          templateKey: "key-1",
          conceptKey: "array-concepts",
          difficultyLevel: "MEDIUM",
          questionType: "multiple_choice",
          version: 1,
          isActive: true,
        },
      ]);

      const context = await contextService.loadContext("exam-123");
      expect(context.examId).toBe("exam-123");
      expect(context.sections.length).toBe(1);
      expect(context.templates.length).toBe(1);
    });

    it("should reject when total difficulty percentages do not equal 100%", async () => {
      prismaMock.examConfig.findUnique.mockResolvedValue({
        id: "exam-123",
        sections: [{ id: "sec-1" }],
        difficultyDistribution: {
          easyPercentage: 20,
          mediumPercentage: 50,
          hardPercentage: 40, // Sum = 110%
        },
      });

      await expect(contextService.loadContext("exam-123")).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException when no active templates are mapped", async () => {
      prismaMock.examConfig.findUnique.mockResolvedValue({
        id: "exam-123",
        sections: [
          {
            id: "sec-1",
            sectionTopics: [
              {
                topic: {
                  id: "topic-1",
                  status: "ACTIVE",
                  concepts: [{ code: "arrays" }],
                },
              },
            ],
          },
        ],
        difficultyDistribution: {
          easyPercentage: 20,
          mediumPercentage: 50,
          hardPercentage: 30,
        },
      });
      prismaMock.template.findMany.mockResolvedValue([]);

      await expect(contextService.loadContext("exam-123")).rejects.toThrow(NotFoundException);
    });
  });

  describe("2. TemplateSelectorService", () => {
    it("should prioritize exact difficulty matching and lower usage balance", async () => {
      prismaMock.concept.findMany.mockResolvedValue([{ code: "concepts-1" }]);
      prismaMock.template.findMany.mockResolvedValue([
        {
          id: "temp-easy",
          difficultyLevel: "EASY",
          version: 1,
          isActive: true,
        },
        {
          id: "temp-med-v1",
          difficultyLevel: "MEDIUM",
          version: 1,
          isActive: true,
        },
        {
          id: "temp-med-v2",
          difficultyLevel: "MEDIUM",
          version: 2,
          isActive: true,
        },
      ]);

      prismaMock.question.groupBy.mockResolvedValue([
        { templateId: "temp-med-v1", _count: { _all: 5 } }, // used 5 times
        { templateId: "temp-med-v2", _count: { _all: 2 } }, // used 2 times (preferred for usage balance)
      ]);

      const selection = await selectorService.selectTemplate({
        topicId: "topic-1",
        difficulty: "MEDIUM",
        questionType: "multiple_choice",
      });

      // Shoud pick temp-med-v2 because it matches MEDIUM and has lower usage than v1
      expect(selection.templateId).toBe("temp-med-v2");
    });
  });

  describe("3. ParameterGeneratorService", () => {
    it("should generate random numbers satisfying min/max bounds and inequality constraints", () => {
      const metadata = {
        variableSchema: {
          variables: [
            { name: "A", type: "number", min: 10, max: 20 },
            { name: "B", type: "number", min: 10, max: 20 },
          ],
        },
        constraints: {
          rules: ["A != B"],
        },
      };

      const params = parameterGenerator.generateParameters(metadata);
      expect(params.A).toBeGreaterThanOrEqual(10);
      expect(params.A).toBeLessThanOrEqual(20);
      expect(params.B).toBeGreaterThanOrEqual(10);
      expect(params.B).toBeLessThanOrEqual(20);
      expect(params.A).not.toEqual(params.B);
    });
  });

  describe("4. QuestionInstantiatorService", () => {
    it("should interpolate placeholders and calculate correct answer dynamically", () => {
      const template = {
        id: "temp-1",
        templateKey: "key-1",
        conceptKey: "concepts-1",
        difficultyLevel: "MEDIUM",
        questionType: "multiple_choice",
        version: 1,
        structure: {
          questionTemplate: "What is {{A}} + {{B}}?",
          explanationTemplate: "Adding yields {{C}}",
          optionsTemplate: ["10", "15", "{{C}}", "25"],
        },
        solutionSchema: {
          formula: "A + B",
        },
      };
      const parameters = { A: 10, B: 5, C: 15 };

      const result = instantiator.instantiate({ template, parameters });
      expect(result.questionText).toBe("What is 10 + 5?");
      expect(result.explanation).toBe("Adding yields 15");
      expect(result.options).toContain("15");
      expect(result.answer).toBe("15");
    });
  });

  describe("5. QuestionValidationService", () => {
    it("should check structural errors and duplicate options", async () => {
      prismaMock.concept.findFirst.mockResolvedValue({ id: "concept-1" });
      prismaMock.template.findUnique.mockResolvedValue({
        id: "temp-1",
        variables: [{ variableName: "A", required: true }],
      });

      const validationInput = {
        questionText: "What is 10 + 10?",
        answer: "20",
        explanation: "explanation text",
        options: ["20", "20", "30", "40"], // duplicate options
        difficulty: "MEDIUM",
        requestedDifficulty: "MEDIUM",
        topicId: "topic-1",
        metadata: {
          templateId: "temp-1",
          templateKey: "key-1",
          conceptKey: "concept-key",
          version: 1,
          parameters: { A: 10 },
        },
      };

      const result = await validationService.validateQuestion(validationInput);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Options contain duplicate choices");
    });
  });

  describe("6. GenerationOrchestratorService", () => {
    it("should orchestrate flow successfully, handling retries", async () => {
      // Mock Context
      const mockContext = {
        examId: "exam-123",
        sections: [{ id: "sec-1", questionCount: 1, sectionDurationMinutes: 10, sectionOrder: 1, code: "sec-1" }],
        topics: [{ id: "topic-1", name: "Arrays", code: "arrays", conceptCodes: ["c1"] }],
        templates: [{ id: "temp-1", templateKey: "k1", conceptKey: "c1", difficultyLevel: "MEDIUM" }],
        difficultyDistribution: { easyPercentage: 0, mediumPercentage: 100, hardPercentage: 0 },
      };

      prismaMock.examConfig.findUnique.mockResolvedValue({
        id: "exam-123",
        sections: [
          {
            id: "sec-1",
            name: "Sec 1",
            questionCount: 1,
            sectionTopics: [
              {
                topic: {
                  id: "topic-1",
                  status: "ACTIVE",
                  concepts: [{ code: "c1" }],
                },
              },
            ],
          },
        ],
        difficultyDistribution: { easyPercentage: 0, mediumPercentage: 100, hardPercentage: 0 },
      });

      prismaMock.concept.findMany.mockResolvedValue([{ code: "c1" }]);
      prismaMock.template.findMany.mockResolvedValue([
        {
          id: "temp-1",
          templateKey: "k1",
          conceptKey: "c1",
          difficultyLevel: "MEDIUM",
          version: 1,
          isActive: true,
          structure: { questionTemplate: "Q", optionsTemplate: ["A", "B"] },
          solutionSchema: { value: "A" },
        },
      ]);
      prismaMock.template.findUnique.mockResolvedValue({
        id: "temp-1",
        variables: [],
      });
      prismaMock.question.groupBy.mockResolvedValue([]);
      prismaMock.question.count.mockResolvedValue(0);
      prismaMock.concept.findFirst.mockResolvedValue({ id: "c1" });

      const response = await orchestrator.generateQuestions("exam-123", "sec-1", 1);
      expect(response.success).toBe(true);
      expect(response.generated).toBe(1);
    });
  });
});
