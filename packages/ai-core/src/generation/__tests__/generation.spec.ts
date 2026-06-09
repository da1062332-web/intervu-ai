import { TemplateSelectorService } from "../template-selector.service";
import { ParameterGeneratorService } from "../parameter-generator.service";
import { QuestionInstantiatorService } from "../question-instantiator.service";
import { GenerationValidationService } from "../validation/generation-validation.service";
import { GenerationService } from "../generation.service";
import { PRNG } from "../utils/random-seed.util";
import { Template } from "@prisma/client";
import { GenerationRequest, GenerationResult } from "../types/generation.types";

describe("Question Generation Engine Unit Tests", () => {
  // Mock Template Repository
  const mockTemplates: Template[] = [
    {
      id: "tpl_123",
      templateKey: "TPL_TEST_PERCENTAGE_EASY",
      conceptKey: "percentages",
      difficultyLevel: "EASY",
      questionType: "MULTIPLE_CHOICE",
      name: "Test Percentage Easy",
      description: null,
      structure: {
        questionTemplate: "What is {percent}% of {amount}?",
        metadata: {
          w1_steps: 1.5,
          w2_number_complexity: 1.2,
          w3_concept_overlap: 1.0,
          w4_trick_factor: 1.0,
        },
      },
      variableSchema: {
        variables: [
          {
            name: "percent",
            type: "number",
            range: { min: 10, max: 50, step: 10 },
          },
          {
            name: "amount",
            type: "number",
            range: { min: 100, max: 500, step: 100 },
          },
        ],
      },
      constraints: { constraints: [] },
      solutionSchema: {
        steps: ["Formula: (percent * amount) / 100"],
        finalAnswer: "(percent * amount) / 100",
      },
      version: 1,
      isActive: true,
      difficulty: "EASY",
      config: {},
      isSystem: true,
      creatorId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ];

  const mockTemplateRepo = {
    findByConceptAndDifficulty: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("TemplateSelectorService (GEN-001, GEN-002)", () => {
    it("GEN-001: should select a template successfully from database", async () => {
      mockTemplateRepo.findByConceptAndDifficulty.mockResolvedValue(
        mockTemplates,
      );
      const selector = new TemplateSelectorService(
        mockTemplateRepo as unknown as TemplateSelectorService["templateRepository"],
      );

      const template = await selector.selectTemplate(
        {
          conceptKey: "percentages",
          difficultyLevel: "easy",
          questionType: "mcq",
        },
        12345,
      );

      expect(template).toBeDefined();
      expect(template.templateKey).toBe("TPL_TEST_PERCENTAGE_EASY");
      expect(mockTemplateRepo.findByConceptAndDifficulty).toHaveBeenCalledWith(
        "percentages",
        "EASY",
      );
    });

    it("GEN-002: should throw an error if template is not found", async () => {
      mockTemplateRepo.findByConceptAndDifficulty.mockResolvedValue([]);
      const selector = new TemplateSelectorService(
        mockTemplateRepo as unknown as TemplateSelectorService["templateRepository"],
      );

      await expect(
        selector.selectTemplate(
          {
            conceptKey: "nonexistent",
            difficultyLevel: "easy",
            questionType: "mcq",
          },
          12345,
        ),
      ).rejects.toThrow("Template not found");
    });
  });

  describe("ParameterGeneratorService (GEN-003, GEN-004)", () => {
    it("GEN-003: should generate parameters successfully matching schema range", () => {
      const generator = new ParameterGeneratorService();
      const prng = new PRNG(42);
      const schema = mockTemplates[0].variableSchema as Record<string, unknown>;
      const constraints = mockTemplates[0].constraints as Record<
        string,
        unknown
      >;

      const params = generator.generateParameters(schema, constraints, prng);

      expect(params).toBeDefined();
      expect(typeof params.percent).toBe("number");
      expect(params.percent).toBeGreaterThanOrEqual(10);
      expect(params.percent).toBeLessThanOrEqual(50);
      expect(typeof params.amount).toBe("number");
    });

    it("GEN-004: should throw if constraints are consistently violated", () => {
      const generator = new ParameterGeneratorService();
      const prng = new PRNG(10);
      const schema = mockTemplates[0].variableSchema as Record<string, unknown>;
      // Impossible constraint
      const constraints = {
        constraints: [{ rule: "percent > 100", severity: "critical" }],
      };

      expect(() =>
        generator.generateParameters(schema, constraints, prng, 5),
      ).toThrow("Failed to generate valid parameters");
    });
  });

  describe("QuestionInstantiatorService (GEN-005, GEN-006)", () => {
    it("GEN-005: should instantiate question text successfully replacing variables", () => {
      const instantiator = new QuestionInstantiatorService();
      const prng = new PRNG(123);
      const structure = mockTemplates[0].structure as Record<string, unknown>;
      const solution = mockTemplates[0].solutionSchema as Record<
        string,
        unknown
      >;
      const params = { percent: 20, amount: 200 };

      const result = instantiator.instantiateQuestion(
        structure,
        solution,
        params,
        prng,
      );

      expect(result.questionText).toBe("What is 20% of 200?");
    });

    it("GEN-006: should compute correct answer and solutions mathematically", () => {
      const instantiator = new QuestionInstantiatorService();
      const prng = new PRNG(123);
      const structure = mockTemplates[0].structure as Record<string, unknown>;
      const solution = mockTemplates[0].solutionSchema as Record<
        string,
        unknown
      >;
      const params = { percent: 20, amount: 200 };

      const result = instantiator.instantiateQuestion(
        structure,
        solution,
        params,
        prng,
      );

      // (20 * 200) / 100 = 40
      expect(result.correctAnswer).toBe("40");
      expect(result.solution.finalAnswer).toBe("40");
    });
  });

  describe("GenerationValidationService (GEN-007, GEN-009, GEN-010)", () => {
    const validResult: GenerationResult = {
      questionText: "What is 20% of 200?",
      options: ["40", "30", "50", "60"],
      correctAnswer: "40",
      solution: { steps: [], finalAnswer: "40" },
      difficultyLevel: "easy",
      conceptKey: "percentages",
      hash: "TPL_TEST_PERCENTAGE_EASY",
      parameters: { percent: 20, amount: 200 },
    };

    it("GEN-007: should validate question successfully with score 1.0", () => {
      const validator = new GenerationValidationService();
      const validation = validator.validateQuestion("q_1", validResult);

      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it("GEN-009: should pass MCQ validation for 4 options containing correct answer", () => {
      const validator = new GenerationValidationService();
      const validation = validator.validateQuestion("q_1", validResult);

      expect(validation.isValid).toBe(true);
      expect(validResult.options.length).toBe(4);
      expect(validResult.options).toContain(validResult.correctAnswer);
    });

    it("GEN-010: should reject invalid option configuration (e.g. less than 4 options)", () => {
      const validator = new GenerationValidationService();
      const invalidResult = {
        ...validResult,
        options: ["40", "30"], // Only 2 options
      };

      const validation = validator.validateQuestion("q_1", invalidResult);

      expect(validation.isValid).toBe(false);
      expect(validation.errors[0]).toContain("at least 4 items");
    });
  });

  describe("GenerationService (GEN-008)", () => {
    it("GEN-008: should produce identical questions deterministically when running twice with same seed", async () => {
      mockTemplateRepo.findByConceptAndDifficulty.mockResolvedValue(
        mockTemplates,
      );

      const selector = new TemplateSelectorService(
        mockTemplateRepo as unknown as TemplateSelectorService["templateRepository"],
      );
      const generator = new ParameterGeneratorService();
      const instantiator = new QuestionInstantiatorService();
      const validator = new GenerationValidationService();

      const generationService = new GenerationService(
        selector,
        generator,
        instantiator,
        validator,
      );

      const request: GenerationRequest = {
        conceptKey: "percentages",
        difficultyLevel: "easy",
        questionType: "mcq",
      };

      const seed = "static_seed_val";

      const run1 = await generationService.generateQuestion(request, seed);
      const run2 = await generationService.generateQuestion(request, seed);

      expect(run1.question.questionText).toBe(run2.question.questionText);
      expect(run1.question.correctAnswer).toBe(run2.question.correctAnswer);
      expect(run1.question.options).toEqual(run2.question.options);
      expect(run1.question.solution).toBe(run2.question.solution);
    });
  });
});
