import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../../prisma/prisma.service";
import { GenerationOrchestratorService } from "../../generation/services/generation-orchestrator.service";
import { QuestionInstantiatorService } from "../../generation/services/question-instantiator.service";
import { QuestionValidationService } from "../../generation/services/question-validation.service";
import { TemplateSelectorService } from "../../generation/services/template-selector.service";
import { GenerationContextService } from "../../generation/services/generation-context.service";
import { ParameterGeneratorService } from "../../generation/services/parameter-generator.service";
import { DifficultyLevel } from "@prisma/client";

describe("Workflow E2E — Generation to Review Queue", () => {
  let orchestrator: GenerationOrchestratorService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      examConfig: { findUnique: jest.fn() },
      template: { findMany: jest.fn(), findUnique: jest.fn() },
      concept: { findMany: jest.fn(), findFirst: jest.fn() },
      question: {
        groupBy: jest.fn(),
        count: jest.fn(),
        create: jest.fn().mockResolvedValue({
          id: "q-generated-001",
          questionText: "How do you declare a variable in Rust?",
          answer: "let x = 5;",
          explanation: "let keyword declares variables in Rust.",
          difficulty: DifficultyLevel.EASY,
          difficultyScore: 0.1,
          source: "GENERATED",
          templateId: "rust-var",
          version: 1,
          status: "DRAFT",
          metadata: {
            options: ["let x = 5;", "var x = 5;", "int x = 5;", "x = 5;"],
          },
        }),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      generatedQuestion: { create: jest.fn() },
      validationLog: { create: jest.fn() },
      generationLog: { create: jest.fn() },
      questionVersion: { create: jest.fn() },
      $transaction: jest.fn((callback) => callback(prismaMock)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerationOrchestratorService,
        {
          provide: QuestionInstantiatorService,
          useValue: {
            instantiate: jest.fn().mockReturnValue({
              questionText: "How do you declare a variable in Rust?",
              answer: "let x = 5;",
              explanation: "let keyword declares variables in Rust.",
              difficulty: DifficultyLevel.EASY,
              difficultyScore: 0.1,
              options: ["let x = 5;", "var x = 5;", "int x = 5;", "x = 5;"],
              metadata: {
                templateId: "rust-var",
                templateKey: "rust_vars",
                conceptKey: "rust_vars",
                version: 1,
                parameters: {},
              },
            }),
          },
        },
        {
          provide: QuestionValidationService,
          useValue: {
            validateQuestion: jest
              .fn()
              .mockResolvedValue({ isValid: true, errors: [] }),
          },
        },
        {
          provide: TemplateSelectorService,
          useValue: {
            selectTemplate: jest.fn().mockResolvedValue({
              templateId: "rust-var",
              metadata: {
                conceptKey: "rust_vars",
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
              id: "exam-rust",
              name: "Rust Core Test",
              role: "BACKEND",
              experienceLevel: "JUNIOR",
              durationMinutes: 60,
              totalQuestions: 20,
              difficultyDistribution: { easy: 100, medium: 0, hard: 0 },
              topics: [{ id: "top-rust", name: "Rust Basics" }],
              sections: [
                { id: "sec-rust", code: "sec-rust", name: "Rust Basics" },
              ],
            }),
          },
        },
        {
          provide: ParameterGeneratorService,
          useValue: {
            generateParameters: jest.fn().mockReturnValue({}),
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
  });

  it("should generate a question, save options to metadata, and create the version 1 snapshot", async () => {
    const result = await orchestrator.generateQuestions(
      "exam-rust",
      "sec-rust",
      1,
    );

    expect(result.success).toBe(true);
    expect(result.generated).toBe(1);

    // Verify Question is saved with options in metadata
    expect(prismaMock.question.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "DRAFT",
          version: 1,
          metadata: expect.objectContaining({
            options: expect.arrayContaining(["let x = 5;"]),
          }),
        }),
      }),
    );

    // Verify Version 1 snapshot is created with options
    expect(prismaMock.questionVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          version: 1,
          snapshot: expect.objectContaining({
            options: expect.arrayContaining(["let x = 5;"]),
          }),
        }),
      }),
    );
  });
});
