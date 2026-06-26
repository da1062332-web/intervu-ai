import { DifficultyValidatorService } from "../validators/difficulty-validator.service";
import { GeneratedQuestionDto } from "../dto/generated-question.dto";

describe("DifficultyValidatorService", () => {
  let service: DifficultyValidatorService;

  beforeEach(() => {
    service = new DifficultyValidatorService();
  });

  it("should return true when difficulty matches requested exactly", async () => {
    const q: GeneratedQuestionDto = {
      question: "Test Q",
      answer: "A",
      explanation: "Exp",
      difficulty: "Medium",
      topic: "Topic",
    };
    const result = await service.validate(q, "Medium");
    expect(result).toBe(true);
  });

  it("should return true when difficulty matches requested case-insensitively", async () => {
    const q: GeneratedQuestionDto = {
      question: "Test Q",
      answer: "A",
      explanation: "Exp",
      difficulty: "easy",
      topic: "Topic",
    };
    const result = await service.validate(q, "Easy");
    expect(result).toBe(true);
  });

  it("should return false when difficulty does not match", async () => {
    const q: GeneratedQuestionDto = {
      question: "Test Q",
      answer: "A",
      explanation: "Exp",
      difficulty: "Hard",
      topic: "Topic",
    };
    const result = await service.validate(q, "Easy");
    expect(result).toBe(false);
  });
});
