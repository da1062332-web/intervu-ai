import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../../prisma/prisma.service";
import { GenerationOrchestratorService } from "../services/generation-orchestrator.service";
import { QuestionInstantiatorService } from "../services/question-instantiator.service";
import { QuestionValidationService } from "../services/question-validation.service";
import { TemplateSelectorService } from "../services/template-selector.service";
import { GenerationContextService } from "../services/generation-context.service";
import { ParameterGeneratorService } from "../services/parameter-generator.service";
import { DifficultyLevel } from "@prisma/client";

describe("AI Generation Failure Recovery Spec", () => {
  let orchestrator: GenerationOrchestratorService;
  let instantiator: QuestionInstantiatorService;
  let validationService: QuestionValidationService;
  let prismaMock: any;

  beforeEach(async () => {
    jest.clearAllMocks();

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
        create: jest.fn().mockResolvedValue({ id: "q-1" }),
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
      questionVersion: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prismaMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerationOrchestratorService,
        {
          provide: QuestionInstantiatorService,
          useValue: {
            instantiate: jest.fn(),
          },
        },
        {
          provide: QuestionValidationService,
          useValue: {
            validateQuestion: jest.fn(),
          },
        },
        {
          provide: TemplateSelectorService,
          useValue: {
            selectTemplate: jest.fn().mockResolvedValue({
              templateId: "t-1",
              metadata: {
                conceptKey: "loop",
                difficultyLevel: "EASY",
                questionType: "mcq",
              },
            }),
            incrementUsage: jest.fn(),
          },
        },
        {
          provide: GenerationContextService,
          useValue: {
            loadContext: jest.fn().mockResolvedValue({
              id: "exam-123",
              name: "Backend Interview",
              role: "BACKEND",
              experienceLevel: "JUNIOR",
              durationMinutes: 60,
              totalQuestions: 20,
              difficultyDistribution: {
                easy: 40,
                medium: 40,
                hard: 20,
              },
              topics: [
                {
                  id: "top-1",
                  name: "Loops",
                },
              ],
              sections: [{ id: "sec-1", code: "sec-1", name: "Loops" }],
            }),
          },
        },
        {
          provide: ParameterGeneratorService,
          useValue: {
            generateParameters: jest.fn().mockReturnValue({
              difficulty: "EASY",
              topicId: "top-1",
              sectionId: "sec-1",
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    orchestrator = module.get<GenerationOrchestratorService>(
      GenerationOrchestratorService,
    );
    instantiator = module.get<QuestionInstantiatorService>(
      QuestionInstantiatorService,
    );
    validationService = module.get<QuestionValidationService>(
      QuestionValidationService,
    );
  });

  it("should successfully recover when LLM provider initially times out, then succeeds", async () => {
    // 1. Mock instantiator to throw timeout twice, then return question on third attempt
    const mockInstantiate = instantiator.instantiate as jest.Mock;
    mockInstantiate
      .mockImplementationOnce(() => {
        throw new Error("Timeout waiting for LLM provider response");
      })
      .mockImplementationOnce(() => {
        throw new Error("Timeout waiting for LLM provider response");
      })
      .mockReturnValueOnce({
        questionText: "What is a loop?",
        answer: "A construct to repeat execution",
        explanation: "Loops run code block repeatedly",
        difficulty: DifficultyLevel.EASY,
        difficultyScore: 0.2,
        options: ["Loop", "Condition", "Class", "Function"],
        metadata: {
          templateId: "t-1",
          templateKey: "loop",
          conceptKey: "loop",
          version: 1,
          parameters: {},
        },
      });

    // 2. Mock validator to succeed
    const mockValidate = validationService.validateQuestion as jest.Mock;
    mockValidate.mockResolvedValue({ isValid: true, errors: [] });

    // 3. Call orchestrator
    const result = await orchestrator.generateQuestions("cfg-1", "sec-1", 1);

    // 4. Assertions
    expect(result.success).toBe(true);
    expect(result.generated).toBe(1);
    expect(mockInstantiate).toHaveBeenCalledTimes(3);

    // Verify recovery logging
    expect(prismaMock.generationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          retryCount: 1,
          message: expect.stringContaining("Timeout"),
        }),
      }),
    );
    expect(prismaMock.generationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "SUCCESS",
          retryCount: 2,
          message: expect.stringContaining("successfully"),
        }),
      }),
    );
  });

  it("should handle malformed JSON from LLM and recover on subsequent retry", async () => {
    const mockInstantiate = instantiator.instantiate as jest.Mock;
    mockInstantiate
      .mockImplementationOnce(() => {
        throw new SyntaxError("Unexpected token < in JSON at position 0");
      })
      .mockReturnValueOnce({
        questionText: "What is an array?",
        answer: "Ordered collection",
        explanation: "Arrays hold items in index order",
        difficulty: DifficultyLevel.EASY,
        difficultyScore: 0.1,
        options: ["Array", "Object", "Set", "Map"],
        metadata: {
          templateId: "t-1",
          templateKey: "loop",
          conceptKey: "loop",
          version: 1,
          parameters: {},
        },
      });

    const mockValidate = validationService.validateQuestion as jest.Mock;
    mockValidate.mockResolvedValue({ isValid: true, errors: [] });

    const result = await orchestrator.generateQuestions("cfg-1", "sec-1", 1);

    expect(result.success).toBe(true);
    expect(result.generated).toBe(1);
    expect(mockInstantiate).toHaveBeenCalledTimes(2);

    expect(prismaMock.generationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          retryCount: 1,
          message: expect.stringContaining("Unexpected token"),
        }),
      }),
    );
  });

  it("should retry and log validation failures when LLM generates incorrect formats", async () => {
    const mockInstantiate = instantiator.instantiate as jest.Mock;
    mockInstantiate.mockReturnValue({
      questionText: "What is inheritance?",
      answer: "Subclassing",
      explanation: "Subclassing extends base classes",
      difficulty: DifficultyLevel.MEDIUM,
      difficultyScore: 0.5,
      options: ["Inheritance", "Polymorphism"], // Invalid MCQ: only 2 options!
      metadata: {
        templateId: "t-1",
        templateKey: "loop",
        conceptKey: "loop",
        version: 1,
        parameters: {},
      },
    });

    const mockValidate = validationService.validateQuestion as jest.Mock;
    mockValidate
      .mockResolvedValueOnce({
        isValid: false,
        errors: ["MCQ must have 4 options"],
      })
      .mockResolvedValueOnce({
        isValid: false,
        errors: ["MCQ must have 4 options"],
      })
      .mockResolvedValueOnce({
        isValid: false,
        errors: ["MCQ must have 4 options"],
      });

    const callOrchestrator = orchestrator.generateQuestions(
      "cfg-1",
      "sec-1",
      1,
    );

    await expect(callOrchestrator).rejects.toThrow();

    expect(mockInstantiate).toHaveBeenCalledTimes(3);
    expect(prismaMock.validationLog.create).toHaveBeenCalledTimes(3);
    expect(prismaMock.generationLog.create).toHaveBeenCalledTimes(1); // Batch failed log at end
  });
});
