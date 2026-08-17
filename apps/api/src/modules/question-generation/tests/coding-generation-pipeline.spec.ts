import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { GenerationStrategy, DifficultyLevel } from "@prisma/client";

import { StrategyRegistry } from "../registry/strategy.registry";
import { ValidationRegistry } from "../registry/validation.registry";
import { PromptTemplateRegistry } from "../registry/prompt-template.registry";
import { GenerationStrategyResolver } from "../services/generation-strategy-resolver.service";
import { CodingPatternGenerationStrategy } from "../strategies/coding-pattern/coding-pattern-generation.strategy";
import { CodingPatternValidator } from "../validation/coding-pattern.validator";
import { CodingPatternSelectorService } from "../../coding/services/coding-pattern-selector.service";
import { CodingStatementGeneratorService } from "../../coding/services/coding-statement-generator.service";
import { PatternExecutionService } from "../../coding/services/pattern-execution.service";
import { OracleRegistry } from "../../coding/oracles/oracle.registry";
import { CodingOracleService } from "../../coding/services/coding-oracle.service";
import { CodingPatternRepository } from "../../coding/repositories/coding-pattern.repository";
import { QuestionAssemblerService } from "../assembler/question-assembler.service";
import { QuestionRepository } from "../repository/question.repository";
import { PrismaService } from "../../../prisma/prisma.service";

// Standard Oracle mock
import { ArrayRotationOracle } from "../../coding/oracles/array-rotation.oracle";

describe("Coding Assessment Generation Pipeline (Phase 2)", () => {
  let strategyRegistry: StrategyRegistry;
  let validationRegistry: ValidationRegistry;
  let codingStrategy: CodingPatternGenerationStrategy;
  let selectorService: CodingPatternSelectorService;
  let executionService: PatternExecutionService;
  let statementGenerator: CodingStatementGeneratorService;
  let oracleRegistry: OracleRegistry;
  let oracleService: CodingOracleService;
  let patternRepo: CodingPatternRepository;
  let questionAssembler: QuestionAssemblerService;
  let questionRepo: QuestionRepository;

  const mockPattern = {
    id: "pat_123",
    patternKey: "array-rotation-pattern",
    title: "Array Left Rotation",
    slug: "array-left-rotation",
    description: "Rotate an array to the left by K positions.",
    difficulty: DifficultyLevel.MEDIUM,
    status: "PUBLISHED" as any,
    version: 1,
    oracleKey: "ARRAY_ROTATION_ORACLE",
    statementSpecification: {},
    parameterSchema: { arraySize: { type: "integer", min: 3, max: 10 }, shift: { type: "integer", min: 1, max: 3 } },
    constraintSchema: {},
    aiConfiguration: {},
    starterCode: { javascript: "function rotateLeft(arr, k) {}" },
    metadata: {},
    creatorId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockPrisma = {
    codingPattern: {
      findMany: jest.fn().mockResolvedValue([mockPattern]),
      count: jest.fn().mockResolvedValue(1),
      findFirst: jest.fn().mockResolvedValue(mockPattern),
    },
    codingOracle: {
      findByKey: jest.fn().mockResolvedValue({
        id: "orc_1",
        key: "ARRAY_ROTATION_ORACLE",
        name: "Array Rotation Oracle",
        isActive: true,
      }),
      findAll: jest.fn().mockResolvedValue({ items: [], total: 1 }),
      upsertByKey: jest.fn().mockResolvedValue({}),
    },
    question: {
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: "q_100", ...data })),
    },
    examSection: {
      findFirst: jest.fn().mockResolvedValue({ id: "sec_1" }),
    },
    template: {
      findUnique: jest.fn().mockResolvedValue({ conceptKey: "array" }),
      findFirst: jest.fn().mockResolvedValue({ id: "tmpl_1", conceptKey: "array" }),
    },
    concept: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
  };

  const arrayRotationOracle = new ArrayRotationOracle();

  beforeEach(async () => {
    oracleRegistry = new OracleRegistry([arrayRotationOracle]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StrategyRegistry,
        ValidationRegistry,
        PromptTemplateRegistry,
        CodingPatternGenerationStrategy,
        CodingPatternValidator,
        CodingPatternSelectorService,
        CodingStatementGeneratorService,
        QuestionAssemblerService,
        QuestionRepository,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: CodingPatternRepository,
          useValue: {
            findAll: jest.fn().mockResolvedValue({ items: [mockPattern], total: 1 }),
            findById: jest.fn().mockResolvedValue(mockPattern),
            findByPatternKey: jest.fn().mockResolvedValue(mockPattern),
            findBySlug: jest.fn().mockResolvedValue(mockPattern),
          },
        },
        {
          provide: CodingOracleService,
          useValue: {
            validateOracleForUsage: jest.fn().mockImplementation(async (key: string) => {
              if (key !== "ARRAY_ROTATION_ORACLE") {
                throw new BadRequestException(`Oracle "${key}" invalid`);
              }
            }),
            hasOracle: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: OracleRegistry,
          useValue: oracleRegistry,
        },
        {
          provide: PatternExecutionService,
          useValue: {
            executePattern: jest.fn().mockResolvedValue({
              parameters: { arraySize: 5, shift: 2 },
              generatedInput: { arr: [1, 2, 3, 4, 5], shift: 2 },
              expectedOutput: { result: [3, 4, 5, 1, 2] },
              publicTests: [{ input: { arr: [1, 2, 3, 4, 5], shift: 2 }, expectedOutput: { result: [3, 4, 5, 1, 2] } }],
              hiddenTests: [{ input: { arr: [10, 20, 30], shift: 1 }, expectedOutput: { result: [20, 30, 10] } }],
              boundaryTests: [{ input: { arr: [1], shift: 0 }, expectedOutput: { result: [1] } }],
              stressTests: [{ input: { arr: Array(100).fill(1), shift: 50 }, expectedOutput: { result: Array(100).fill(1) } }],
              validation: { valid: true, errors: [], warnings: [] },
            }),
          },
        },
      ],
    }).compile();

    strategyRegistry = module.get<StrategyRegistry>(StrategyRegistry);
    validationRegistry = module.get<ValidationRegistry>(ValidationRegistry);
    codingStrategy = module.get<CodingPatternGenerationStrategy>(CodingPatternGenerationStrategy);
    selectorService = module.get<CodingPatternSelectorService>(CodingPatternSelectorService);
    executionService = module.get<PatternExecutionService>(PatternExecutionService);
    statementGenerator = module.get<CodingStatementGeneratorService>(CodingStatementGeneratorService);
    oracleService = module.get<CodingOracleService>(CodingOracleService);
    patternRepo = module.get<CodingPatternRepository>(CodingPatternRepository);
    questionAssembler = module.get<QuestionAssemblerService>(QuestionAssemblerService);
    questionRepo = module.get<QuestionRepository>(QuestionRepository);

    strategyRegistry.register(GenerationStrategy.CODING_PATTERN, codingStrategy);
    validationRegistry.register(GenerationStrategy.CODING_PATTERN, module.get(CodingPatternValidator));
  });

  describe("1. Happy Path Execution", () => {
    it("should execute end-to-end selection -> strategy execution -> assembly -> persistence", async () => {
      const templateMock: any = {
        id: "tmpl_coding_1",
        templateKey: "tmpl_coding_1_key",
        conceptKey: "arrays",
        difficultyLevel: DifficultyLevel.MEDIUM,
        generationStrategy: GenerationStrategy.CODING_PATTERN,
        metadata: {},
      };

      // Resolve strategy from registry
      const strategy = strategyRegistry.resolve(GenerationStrategy.CODING_PATTERN);
      expect(strategy).toBeDefined();

      // Generate context
      const context = await strategy.generate(templateMock);
      expect(context.strategy).toBe(GenerationStrategy.CODING_PATTERN);
      expect(context.payload).toBeDefined();

      const payload = context.payload as any;
      expect(payload.oracleKey).toBe("ARRAY_ROTATION_ORACLE");
      expect(payload.publicTests).toHaveLength(1);
      expect(payload.hiddenTests).toHaveLength(1);
      expect(payload.boundaryTests).toHaveLength(1);
      expect(payload.stressTests).toHaveLength(1);

      // Validate context
      const validator = validationRegistry.resolve(GenerationStrategy.CODING_PATTERN);
      const rawQuestionMock = {
        questionText: payload.aiStatement?.narrative || "Rotate array left by K positions.",
        options: [],
        correctAnswer: JSON.stringify(payload.expectedOutput),
        explanation: "Time complexity O(N)",
      };

      const valResult = await validator.validate(context, rawQuestionMock);
      expect(valResult.valid).toBe(true);

      // Assemble question
      const assembled = questionAssembler.assemble(
        context,
        rawQuestionMock,
        templateMock.id,
        "topic_arrays",
        "sec_coding",
      );
      expect(assembled.generationStrategy).toBe(GenerationStrategy.CODING_PATTERN);

      // Save question
      const saved = await questionRepo.save(assembled);
      expect(saved.questionType).toBe("CODING");
      expect(saved.codingData).toBeDefined();
      expect(saved.codingData.oracleKey).toBe("ARRAY_ROTATION_ORACLE");
    });
  });

  describe("2. Error Handling & Edge Cases", () => {
    it("should throw NotFoundException when no pattern matches topic/difficulty", async () => {
      jest.spyOn(patternRepo, "findAll").mockResolvedValue({ items: [], total: 0 });

      await expect(
        selectorService.selectPattern({
          difficulty: DifficultyLevel.HARD,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should reject pattern selection when target Oracle is invalid/inactive", async () => {
      jest.spyOn(oracleService, "validateOracleForUsage").mockRejectedValueOnce(
        new BadRequestException("Oracle inactive"),
      );

      await expect(
        selectorService.selectPattern({
          difficulty: DifficultyLevel.MEDIUM,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should fall back gracefully to pattern defaults if AI statement generator fails", async () => {
      const mockFailingLlmAdapter = {
        generate: jest.fn().mockRejectedValue(new Error("LLM API Timeout")),
      };

      const failingGenerator = new CodingStatementGeneratorService(mockFailingLlmAdapter);
      const statement = await failingGenerator.generateStatement(mockPattern as any, {
        parameters: {},
        generatedInput: { arr: [1, 2] },
        expectedOutput: { result: [2, 1] },
        publicTests: [],
        hiddenTests: [],
        stressTests: [],
        boundaryTests: [],
        validation: { valid: true, errors: [], warnings: [] },
      });

      expect(statement.title).toBe(mockPattern.title);
      expect(statement.narrative).toContain(mockPattern.description);
    });

    it("should exclude recently used pattern IDs via anti-repetition filter", async () => {
      const pat2 = { ...mockPattern, id: "pat_456", patternKey: "pat_key_456" };
      jest.spyOn(patternRepo, "findAll").mockResolvedValueOnce({ items: [mockPattern, pat2], total: 2 });

      const selected = await selectorService.selectPattern({
        recentlyUsedPatternIds: ["pat_123"],
      });

      expect(selected.id).toBe("pat_456");
    });
  });

  describe("3. Regression Checks for VARIABLE, DATASET, HYBRID", () => {
    it("should verify strategy registry supports VARIABLE, DATASET, HYBRID, and CODING_PATTERN", () => {
      const dummyStrategy: any = { generate: jest.fn() };
      strategyRegistry.register(GenerationStrategy.VARIABLE, dummyStrategy);
      strategyRegistry.register(GenerationStrategy.DATASET, dummyStrategy);
      strategyRegistry.register(GenerationStrategy.HYBRID, dummyStrategy);

      expect(strategyRegistry.hasStrategy(GenerationStrategy.VARIABLE)).toBe(true);
      expect(strategyRegistry.hasStrategy(GenerationStrategy.DATASET)).toBe(true);
      expect(strategyRegistry.hasStrategy(GenerationStrategy.HYBRID)).toBe(true);
      expect(strategyRegistry.hasStrategy(GenerationStrategy.CODING_PATTERN)).toBe(true);
    });
  });
});
