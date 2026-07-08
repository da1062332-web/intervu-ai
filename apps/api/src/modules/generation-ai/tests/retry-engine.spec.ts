import { GenerationRetryService } from "../retry/generation-retry.service";
import { PromptBuilderService } from "../prompts/prompt-builder.service";
import { QuestionGeneratorService } from "../generators/question-generator.service";
import { OptionGeneratorService } from "../generators/option-generator.service";
import { ExplanationGeneratorService } from "../generators/explanation-generator.service";
import { ResponseValidatorService } from "../validators/response-validator.service";
import { GenerationAuditService } from "../services/generation-audit.service";
import { MockAdapter } from "../adapters/mock.adapter";

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
      checkDuplicate: jest.fn().mockResolvedValue({ duplicate: false, similarity: 0.0 }),
    } as any;

    qualityScorer = {
      score: jest.fn().mockResolvedValue({ score: 90, status: "PASS", reasons: [] }),
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
