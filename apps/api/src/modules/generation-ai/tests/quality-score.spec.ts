import { QuestionQualityService } from "../scorers/question-quality.service";
import { TopicAlignmentService } from "../validators/topic-alignment.service";
import { DifficultyValidatorService } from "../validators/difficulty-validator.service";
import { GeneratedQuestionDto } from "../dto/generated-question.dto";

describe("QuestionQualityService", () => {
  let service: QuestionQualityService;
  let topicValidator: jest.Mocked<TopicAlignmentService>;
  let difficultyValidator: jest.Mocked<DifficultyValidatorService>;

  beforeEach(() => {
    topicValidator = {
      validate: jest.fn(),
    } as any;
    difficultyValidator = {
      validate: jest.fn(),
    } as any;

    service = new QuestionQualityService(topicValidator, difficultyValidator);
  });

  it("should score 100 and PASS when all criteria are fully met", async () => {
    topicValidator.validate.mockResolvedValue({ match: true, confidence: 1.0 });
    difficultyValidator.validate.mockResolvedValue(true);

    const q: GeneratedQuestionDto = {
      question: "This is a very long and clear question text.",
      answer: "Valid Answer",
      explanation: "Concept\nMath.\n\nFormula / Reasoning\nRules.\n\nStep-by-Step Solution\n1. Solve.\n\nFinal Answer\nValid Answer",
      difficulty: "Medium",
      topic: "Percentages",
    };

    const result = await service.score(q, "Percentages", "Medium");
    expect(result.score).toBe(100);
    expect(result.status).toBe("PASS");
    expect(result.reasons).toHaveLength(0);
  });

  it("should score low and FAIL when topic and difficulty do not align", async () => {
    topicValidator.validate.mockResolvedValue({
      match: false,
      confidence: 0.0,
    });
    difficultyValidator.validate.mockResolvedValue(false);

    const q: GeneratedQuestionDto = {
      question: "This is a valid question text.",
      answer: "Answer",
      explanation: "Concept\nMath.\n\nFormula / Reasoning\nRules.\n\nStep-by-Step Solution\n1. Solve.\n\nFinal Answer\nAnswer",
      difficulty: "Easy",
      topic: "Probability",
    };

    const result = await service.score(q, "Percentages", "Hard");
    // Weighted Score:
    // Clarity (10%): 100 -> 10
    // Validity (20%): 100 -> 20
    // Explanation (20%): 100 -> 20
    // Compliance (20%): 0 -> 0
    // Difficulty (20%): 0 -> 0
    // Parity (10%): 100 -> 10
    // Total: 60 -> FAIL
    expect(result.score).toBe(60);
    expect(result.status).toBe("FAIL");
    expect(result.reasons).toContain(
      'Topic mismatch: requested "Percentages", generated "Probability"',
    );
    expect(result.reasons).toContain(
      'Difficulty mismatch: requested "Hard", generated "Easy"',
    );
  });

  it("should FAIL when structure is empty or placeholder is used", async () => {
    topicValidator.validate.mockResolvedValue({ match: true, confidence: 1.0 });
    difficultyValidator.validate.mockResolvedValue(true);

    const q: GeneratedQuestionDto = {
      question: "Too short",
      answer: "TODO placeholder",
      explanation: "Too short",
      difficulty: "Medium",
      topic: "Percentages",
    };

    const result = await service.score(q, "Percentages", "Medium");
    expect(result.status).toBe("FAIL");
    expect(result.reasons).toContain(
      "Question structure is too short or empty.",
    );
    expect(result.reasons).toContain("Answer contains placeholder/TODO text.");
  });
});
