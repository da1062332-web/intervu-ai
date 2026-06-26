import { GenerationRetryService } from "../retry/generation-retry.service";
import { MockAdapter } from "../adapters/mock.adapter";
import { ResponseParserService } from "../validators/response-parser.service";
import { QuestionQualityService } from "../scorers/question-quality.service";
import { TopicAlignmentService } from "../validators/topic-alignment.service";
import { DifficultyValidatorService } from "../validators/difficulty-validator.service";
import { DuplicateDetectorService } from "../validators/duplicate-detector.service";
import { GenerationAuditService } from "../services/generation-audit.service";

describe("GenerationRetryService", () => {
  let service: GenerationRetryService;
  let mockAdapter: MockAdapter;
  let responseParser: ResponseParserService;
  let qualityScorer: QuestionQualityService;
  let topicValidator: TopicAlignmentService;
  let difficultyValidator: DifficultyValidatorService;
  let duplicateDetector: jest.Mocked<DuplicateDetectorService>;
  let auditService: jest.Mocked<GenerationAuditService>;

  beforeEach(() => {
    mockAdapter = new MockAdapter();
    responseParser = new ResponseParserService();
    topicValidator = new TopicAlignmentService();
    difficultyValidator = new DifficultyValidatorService();
    duplicateDetector = {
      checkDuplicate: jest
        .fn()
        .mockResolvedValue({ duplicate: false, similarity: 0.0 }),
    } as any;
    auditService = {
      log: jest.fn().mockResolvedValue({ id: "log-1" }),
    } as any;

    qualityScorer = new QuestionQualityService(
      topicValidator,
      difficultyValidator,
    );

    service = new GenerationRetryService(
      mockAdapter,
      responseParser,
      qualityScorer,
      topicValidator,
      difficultyValidator,
      duplicateDetector,
      auditService,
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
    expect(result.question?.difficulty).toBe("Medium");
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
