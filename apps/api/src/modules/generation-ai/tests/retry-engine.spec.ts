import { GenerationRetryService } from "../retry/generation-retry.service";
import { PromptBuilderService } from "../prompts/prompt-builder.service";
import { QuestionGeneratorService } from "../generators/question-generator.service";
import { OptionGeneratorService } from "../generators/option-generator.service";
import { ExplanationGeneratorService } from "../generators/explanation-generator.service";
import { ResponseValidatorService } from "../validators/response-validator.service";
import { GenerationAuditService } from "../services/generation-audit.service";
import { MockAdapter } from "../adapters/mock.adapter";
import { ParameterGeneratorService } from "../../generation/services/parameter-generator.service";

describe("GenerationRetryService", () => {
  let service: GenerationRetryService;
  let mockAdapter: MockAdapter;
  let promptBuilder: PromptBuilderService;
  let questionGenerator: QuestionGeneratorService;
  let optionGenerator: OptionGeneratorService;
  let explanationGenerator: ExplanationGeneratorService;
  let responseValidator: ResponseValidatorService;
  let auditService: jest.Mocked<GenerationAuditService>;
  let duplicateDetector: any;
  let qualityScorer: any;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      template: {
        findFirst: jest.fn().mockResolvedValue({
          id: "tpl-1",
          name: "Test Template",
          conceptKey: "Percentages",
          difficultyLevel: "MEDIUM",
          questionType: "mcq",
          structure: { questionTemplate: "Evaluate percentage sum." },
          variableSchema: { variables: [] },
          constraints: { constraints: [] },
          solutionSchema: {
            steps: ["Calculate step"],
            finalAnswer: "42",
          },
        }),
      },
      generationAuditLog: {
        create: jest.fn().mockResolvedValue({ id: "log-1" }),
      },
      styleProfile: {
        findFirst: jest.fn().mockResolvedValue({
          id: "style-1",
          name: "Default Style",
          isDefault: true,
          active: true,
        }),
      },
    };

    mockAdapter = new MockAdapter();
    promptBuilder = new PromptBuilderService();
    questionGenerator = new QuestionGeneratorService(mockAdapter);
    optionGenerator = new OptionGeneratorService();
    explanationGenerator = new ExplanationGeneratorService();
    responseValidator = new ResponseValidatorService();

    auditService = {
      log: jest.fn().mockResolvedValue({ id: "log-1" }),
    } as any;

    duplicateDetector = {
      checkDuplicate: jest
        .fn()
        .mockResolvedValue({ duplicate: false, similarity: 0.0 }),
    } as any;

    qualityScorer = {
      score: jest
        .fn()
        .mockResolvedValue({ score: 90, status: "PASS", reasons: [] }),
    } as any;

    service = new GenerationRetryService(
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
  });

  it("should successfully generate and validate a question in one attempt", async () => {
    const result = await service.generateWithRetry(
      "quantitative",
      "Percentages",
      "Medium",
    );
    expect(result.success).toBe(true);
    expect(result.attempts).toBe(1);
    expect(result.question?.topic).toBe("Percentages");
    expect(result.question?.difficulty).toBe("MEDIUM");
    expect(auditService.log).toHaveBeenCalledTimes(1);
  });

  it("should retry up to 3 times and fail if LLM returns malformed JSON", async () => {
    jest.spyOn(mockAdapter, "generate").mockResolvedValue("{ malformed json }");

    const result = await service.generateWithRetry(
      "quantitative",
      "Percentages",
      "Medium",
      3,
    );
    expect(result.success).toBe(false);
    expect(result.attempts).toBe(3);
    expect(auditService.log).toHaveBeenCalledTimes(3);
  });

  it("should use backend-hydrated question text for VARIABLE templates when LLM changes numeric values", async () => {
    const fixedVariables = {
      principal_amount: 10000,
      annual_rate: 5,
      year_number: 3,
      yearly_interest: 551.25,
    };

    service = new GenerationRetryService(
      prisma,
      promptBuilder,
      questionGenerator,
      optionGenerator,
      explanationGenerator,
      responseValidator,
      auditService,
      duplicateDetector,
      qualityScorer,
      {
        generateParameters: jest.fn().mockReturnValue(fixedVariables),
      } as any,
      {} as any,
      {} as any,
    );

    jest.spyOn(mockAdapter, "generate").mockResolvedValue(
      JSON.stringify({
        question:
          "A person invested a certain sum of money at 5% per annum, compounded annually. If the compound interest earned during the 3rd year is Rs. 500, what was the sum of money invested?",
        options: ["Rs. 10000", "Rs. 9000", "Rs. 11000", "Rs. 9500"],
        correctAnswer: "Rs. 10000",
        answer: "Rs. 10000",
        explanation:
          "Concept\nCompound interest by year.\n\nFormula / Reasoning\nUse yearly interest.\n\nStep-by-Step Solution\nThe backend resolved the principal as Rs. 10000.\n\nFinal Answer\nRs. 10000",
        difficulty: "medium",
        topic: "compound_interest",
      }),
    );

    const result = await service.generateFromTemplate(
      {
        id: "tpl-ci",
        name: "Compound Interest Template",
        description: "Find principal from yearly compound interest.",
        conceptKey: "compound_interest",
        difficultyLevel: "MEDIUM",
        questionType: "mcq",
        generationStrategy: "VARIABLE",
        structure: {
          questionTemplate:
            "A person invested a certain sum of money at {{annual_rate}}% per annum, compounded annually. If the compound interest earned during the {{year_number}}th year is Rs. {{yearly_interest}}, what was the sum of money invested?",
        },
        variableSchema: { variables: [] },
        constraints: { constraints: [] },
        solutionSchema: {
          correctVariable: "principal_amount",
        },
      },
      fixedVariables,
      1,
    );

    expect(result.success).toBe(true);
    expect(result.question?.question).toContain("Rs. 551");
    expect(result.question?.question).not.toContain("Rs. 551.25");
    expect(result.question?.question).not.toContain("Rs. 500");
    expect(result.question?.correctAnswer).toBe("Rs. 10000");
  });

  it("should hydrate VARIABLE canonical question with derived variables resolved from variableSchema", async () => {
    jest.spyOn(mockAdapter, "generate").mockResolvedValue(
      JSON.stringify({
        question:
          "A person invested a certain sum of money at 5% per annum, compounded annually. If the compound interest earned during the 3rd year is Rs. 500, what was the sum of money invested?",
        options: ["Rs. 10000", "Rs. 9000", "Rs. 11000", "Rs. 9500"],
        correctAnswer: "Rs. 10000",
        answer: "Rs. 10000",
        explanation:
          "Concept\nCompound interest by year.\n\nFormula / Reasoning\nUse yearly interest.\n\nStep-by-Step Solution\nThe backend resolved the principal as Rs. 10000.\n\nFinal Answer\nRs. 10000",
        difficulty: "medium",
        topic: "compound_interest",
      }),
    );

    const result = await service.generateFromTemplate(
      {
        id: "tpl-ci-derived",
        name: "Compound Interest Template",
        description: "Find principal from yearly compound interest.",
        conceptKey: "compound_interest",
        difficultyLevel: "MEDIUM",
        questionType: "mcq",
        generationStrategy: "VARIABLE",
        structure: {
          questionTemplate:
            "A person invested a certain sum of money at {{annual_rate}}% per annum, compounded annually. If the compound interest earned during the {{year_number}}th year is Rs. {{yearly_interest}}, what was the sum of money invested?",
        },
        variableSchema: {
          variables: [
            { name: "principal_amount", type: "integer", min: 10000, max: 10000 },
            { name: "annual_rate", type: "integer", min: 5, max: 5 },
            { name: "year_number", type: "integer", min: 3, max: 3 },
          ],
          derivedVariables: [
            {
              name: "yearly_interest",
              expression:
                "principal_amount * (1 + annual_rate / 100) ^ (year_number - 1) * (annual_rate / 100)",
            },
          ],
        },
        constraints: { constraints: [] },
        solutionSchema: {
          correctVariable: "principal_amount",
        },
      },
      {},
      1,
    );

    expect(result.success).toBe(true);
    expect(result.question?.metadata?.variables).toMatchObject({
      principal_amount: 10000,
      annual_rate: 5,
      year_number: 3,
      yearly_interest: 551.25,
    });
    expect(result.question?.question).toContain("Rs. 551");
    expect(result.question?.question).not.toContain("Rs. 551.25");
    expect(result.question?.question).not.toContain("{{yearly_interest}}");
    expect(result.question?.correctAnswer).toBe("Rs. 10000");
  });

  it("should preview VARIABLE question when stale rules coexist with valid structured constraints", async () => {
    jest.spyOn(mockAdapter, "generate").mockResolvedValue(
      JSON.stringify({
        question:
          "A person invested a certain sum of money at 5% per annum, compounded annually. If the compound interest earned during the 3rd year is Rs. 500, what was the sum of money invested?",
        options: ["10000", "9000", "11000", "9500"],
        correctAnswer: "10000",
        answer: "10000",
        explanation:
          "Concept\nCompound interest by year.\n\nFormula / Reasoning\nUse yearly interest 551.25.\n\nStep-by-Step Solution\nThe backend resolved 5, 3, 551.25, and 10000.\n\nFinal Answer\n10000",
        difficulty: "medium",
        topic: "compound_interest",
      }),
    );

    const result = await service.generateFromTemplate(
      {
        id: "tpl-ci-stale-rules",
        name: "Compound Interest Template",
        description: "Find principal from yearly compound interest.",
        conceptKey: "compound_interest",
        difficultyLevel: "MEDIUM",
        questionType: "mcq",
        generationStrategy: "VARIABLE",
        structure: {
          questionTemplate:
            "A person invested a certain sum of money at {{annual_rate}}% per annum, compounded annually. If the compound interest earned during the {{year_number}}th year is Rs. {{yearly_interest}}, what was the sum of money invested?",
        },
        variableSchema: {
          variables: [
            { name: "principal_amount", type: "integer", min: 10000, max: 10000 },
            { name: "annual_rate", type: "integer", min: 5, max: 5 },
            { name: "year_number", type: "integer", min: 3, max: 3 },
          ],
          derivedVariables: [
            {
              name: "yearly_interest",
              expression:
                "principal_amount * (1 + annual_rate / 100) ^ (year_number - 1) * (annual_rate / 100)",
            },
          ],
        },
        constraints: {
          rules: [
            "compound_interest_yearly >= 1",
            "principal > 0",
            "compound_interest_earned % 1 == 0",
            "principal_amount % 100 == 0",
          ],
          constraints: [
            { rule: "principal_amount % 100 == 0" },
          ],
        },
        solutionSchema: {
          correctVariable: "principal_amount",
        },
      },
      {},
      1,
    );

    expect(result.success).toBe(true);
    expect(result.question?.metadata?.variables).toMatchObject({
      principal_amount: 10000,
      annual_rate: 5,
      year_number: 3,
      yearly_interest: 551.25,
    });
    expect(result.question?.question).toContain("Rs. 551");
    expect(result.question?.question).not.toContain("Rs. 551.25");
    expect(result.question?.question).not.toMatch(/\{\{?([a-zA-Z0-9_]+)\}?\}/);
    expect(result.question?.correctAnswer).toBe("10000");
    expect(result.question?.options).toContain("10000");
  });

  it("should format decimal display values without changing internal correctAnswer", async () => {
    const fixedVariables = {
      principal_amount: 10000,
      annual_rate: 5,
      year_number: 5,
      yearly_interest: 3245.4016875000007,
      growth_rate: 12.3456,
    };

    service = new GenerationRetryService(
      prisma,
      promptBuilder,
      questionGenerator,
      optionGenerator,
      explanationGenerator,
      responseValidator,
      auditService,
      duplicateDetector,
      qualityScorer,
      {
        generateParameters: jest.fn().mockReturnValue(fixedVariables),
      } as any,
      {} as any,
      {} as any,
    );

    jest.spyOn(mockAdapter, "generate").mockResolvedValue(
      JSON.stringify({
        question:
          "A person invested a certain sum of money at 5% per annum. If the compound interest earned during the 5th year is Rs. 3245.4016875000007, what was the sum invested?",
        options: ["10000", "9000", "11000", "9500"],
        correctAnswer: "10000",
        answer: "10000",
        explanation:
          "Concept\nCompound interest.\n\nFormula / Reasoning\nUse yearly interest.\n\nStep-by-Step Solution\nThe principal is 10000.\n\nFinal Answer\n10000",
        difficulty: "medium",
        topic: "compound_interest",
      }),
    );

    const result = await service.generateFromTemplate(
      {
        id: "tpl-display-format",
        name: "Compound Interest Display Template",
        description: "Find principal from yearly compound interest.",
        conceptKey: "compound_interest",
        difficultyLevel: "MEDIUM",
        questionType: "mcq",
        generationStrategy: "VARIABLE",
        structure: {
          questionTemplate:
            "A person invested Rs. {{principal_amount}} at {{annual_rate}}% per annum with growth {{growth_rate}}%. If the compound interest earned during the {{year_number}}th year is Rs. {{yearly_interest}}, what was the sum invested?",
        },
        variableSchema: { variables: [] },
        constraints: { constraints: [] },
        solutionSchema: {
          correctVariable: "principal_amount",
        },
      },
      fixedVariables,
      1,
    );

    expect(result.success).toBe(true);
    expect(result.question?.question).toContain("Rs. 10000");
    expect(result.question?.question).toContain("growth 12.35%");
    expect(result.question?.question).toContain("Rs. 3245");
    expect(result.question?.question).not.toContain("Rs. 3245.40");
    expect(result.question?.question).not.toContain("3245.4016875000007");
    expect(result.question?.metadata?.variables).toMatchObject(fixedVariables);
    expect(result.question?.correctAnswer).toBe("10000");
  });

  it("should normalize decimal options and correct answer together while preserving raw metadata", async () => {
    const fixedVariables = {
      lcm_input: 13339,
      hcf_input: 39,
      calculated_answer: 342.02564102564105,
    };

    service = new GenerationRetryService(
      prisma,
      promptBuilder,
      questionGenerator,
      optionGenerator,
      explanationGenerator,
      responseValidator,
      auditService,
      duplicateDetector,
      qualityScorer,
      {
        generateParameters: jest.fn().mockReturnValue(fixedVariables),
      } as any,
      {} as any,
      {} as any,
    );

    jest.spyOn(mockAdapter, "generate").mockResolvedValue(
      JSON.stringify({
        question: "Calculate the required value.",
        options: [
          "342.02564102564105",
          "341.02564102564105",
          "343.02564102564105",
          "344.02564102564105",
        ],
        correctAnswer: "342.02564102564105",
        answer: "342.02564102564105",
        explanation:
          "Concept\nLCM/HCF calculation.\n\nFormula / Reasoning\nUse 13339/39.\n\nStep-by-Step Solution\nThe quotient is 342.02564102564105.\n\nFinal Answer\n342.02564102564105",
        difficulty: "medium",
        topic: "lcm_hcf",
      }),
    );

    const result = await service.generateFromTemplate(
      {
        id: "tpl-lcm-hcf-display",
        name: "LCM HCF Display Template",
        description: "Display formatting for calculated answer.",
        conceptKey: "lcm_hcf",
        difficultyLevel: "MEDIUM",
        questionType: "mcq",
        generationStrategy: "VARIABLE",
        structure: {
          questionTemplate:
            "Given the fraction {{lcm_input}}/{{hcf_input}}, calculate the decimal value {{calculated_answer}}.",
        },
        variableSchema: { variables: [] },
        constraints: { constraints: [] },
        solutionSchema: {
          correctVariable: "calculated_answer",
        },
      },
      fixedVariables,
      1,
    );

    expect(result.success).toBe(true);
    expect(result.question?.question).toContain("342.03");
    expect(result.question?.question).toContain("13339/39");
    expect(result.question?.options).toContain("342.03");
    expect(result.question?.correctAnswer).toBe("342.03");
    expect(result.question?.answer).toBe("342.03");
    expect(result.question?.explanation).toContain("342.03");
    expect(result.question?.explanation).toContain("13339/39");
    expect(result.question?.metadata?.variables).toMatchObject(fixedVariables);
  });

  it("should validate 100 questions under 15 seconds (Performance Target)", async () => {
    const start = Date.now();

    const promises = Array.from({ length: 100 }).map(() =>
      service.generateWithRetry("quantitative", "Percentages", "Medium", 1),
    );

    const results = await Promise.all(promises);
    const duration = Date.now() - start;

    expect(results.every((res) => res.success)).toBe(true);
    expect(duration).toBeLessThan(15000); // 15 seconds target
    console.log(`Performance check: 100 questions validated in ${duration}ms`);
  });
});
