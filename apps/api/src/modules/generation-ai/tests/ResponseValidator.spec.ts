import { ResponseValidatorService } from "../validators/response-validator.service";
import { GeneratedQuestionDto } from "../dto/generated-question.dto";

describe("ResponseValidatorService", () => {
  let service: ResponseValidatorService;

  beforeEach(() => {
    service = new ResponseValidatorService();
  });

  const getValidMcq = (): GeneratedQuestionDto => ({
    question: "What is the sum of 5 and 7? (Valid long text)",
    options: ["12", "15", "18", "20"],
    correctAnswer: "12",
    answer: "12",
    explanation: "Sum of 5 and 7 is 12.",
    difficulty: "easy",
    topic: "addition",
    metadata: { topic: "addition" },
  });

  it("should successfully pass validation for a valid MCQ question", () => {
    expect(() =>
      service.validate(getValidMcq(), "easy", "addition"),
    ).not.toThrow();
  });

  it("should throw error if question text is too short", () => {
    const q = getValidMcq();
    q.question = "Short";

    expect(() => service.validate(q, "easy", "addition")).toThrow(
      "Question text must be at least 10 characters long",
    );
  });

  it("should throw error if MCQ correct answer is missing from options", () => {
    const q = getValidMcq();
    q.correctAnswer = "99";

    expect(() => service.validate(q, "easy", "addition")).toThrow(
      'Correct answer "99" is not present in options',
    );
  });

  it("should throw error if duplicate options exist", () => {
    const q = getValidMcq();
    q.options = ["12", "12", "18", "20"];

    expect(() => service.validate(q, "easy", "addition")).toThrow(
      "MCQ options contain duplicate values",
    );
  });

  it("should throw error if there are raw curly brace placeholder leakage in question", () => {
    const q = getValidMcq();
    q.question = "What is the sum of {{a}} and 7?";

    expect(() => service.validate(q, "easy", "addition")).toThrow(
      "Question text contains unresolved template placeholder tokens",
    );
  });

  it("should throw error if there is difficulty mismatch", () => {
    expect(() => service.validate(getValidMcq(), "hard", "addition")).toThrow(
      'Difficulty mismatch: requested "hard" but got "easy"',
    );
  });

  it("should throw error if there is topic mismatch", () => {
    expect(() =>
      service.validate(getValidMcq(), "easy", "subtraction"),
    ).toThrow("Topic alignment check failed");
  });
});
