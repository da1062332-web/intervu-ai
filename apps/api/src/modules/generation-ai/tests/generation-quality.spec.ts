import { GenerationQualityService } from "../evaluators/generation-quality.service";
import { TopicAlignmentService } from "../validators/topic-alignment.service";
import { DifficultyValidatorService } from "../validators/difficulty-validator.service";
import { GeneratedQuestionDto } from "../dto/generated-question.dto";

describe("GenerationQualityService", () => {
  let service: GenerationQualityService;
  let topicValidator: jest.Mocked<TopicAlignmentService>;
  let difficultyValidator: jest.Mocked<DifficultyValidatorService>;

  beforeEach(() => {
    topicValidator = {
      validate: jest.fn(),
    } as any;
    difficultyValidator = {
      validate: jest.fn(),
    } as any;

    service = new GenerationQualityService(topicValidator, difficultyValidator);
  });

  it("should evaluate a batch and return quality statistics", async () => {
    topicValidator.validate.mockResolvedValue({ match: true, confidence: 1.0 });
    difficultyValidator.validate.mockResolvedValue(true);

    const questions: GeneratedQuestionDto[] = [
      { question: "Q1 text is long enough", answer: "A1", explanation: "E1", difficulty: "Medium", topic: "Percentages" },
      { question: "Q2 text is long enough", answer: "A2", explanation: "E2", difficulty: "Medium", topic: "Percentages" },
    ];

    const report = await service.evaluateBatch(questions, "Percentages", "Medium");
    expect(report.totalGenerated).toBe(2);
    expect(report.totalPassed).toBe(2);
    expect(report.duplicateRate).toBe(0);
    expect(report.topicAccuracy).toBe(100);
    expect(report.difficultyAccuracy).toBe(100);
    expect(report.validationSuccessRate).toBe(100);
  });

  it("should detect duplicate questions in the batch", async () => {
    topicValidator.validate.mockResolvedValue({ match: true, confidence: 1.0 });
    difficultyValidator.validate.mockResolvedValue(true);

    const questions: GeneratedQuestionDto[] = [
      { question: "Duplicate Text", answer: "A1", explanation: "E1", difficulty: "Medium", topic: "Percentages" },
      { question: "Duplicate Text", answer: "A2", explanation: "E2", difficulty: "Medium", topic: "Percentages" },
    ];

    const report = await service.evaluateBatch(questions, "Percentages", "Medium");
    expect(report.duplicateRate).toBe(50);
    expect(report.validationSuccessRate).toBe(50);
  });
});
