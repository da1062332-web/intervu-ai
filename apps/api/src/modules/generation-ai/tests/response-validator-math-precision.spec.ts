import { ResponseValidatorService } from "../validators/response-validator.service";
import { GeneratedQuestionDto } from "../dto/generated-question.dto";

describe("ResponseValidatorService math precision", () => {
  let service: ResponseValidatorService;

  beforeEach(() => {
    service = new ResponseValidatorService();
  });

  const getQuestion = (
    correctAnswer: string,
    backendAnswer: number | string,
    options = ["637", "638", "639", "640"],
  ): GeneratedQuestionDto => ({
    question: "What is the calculated yearly interest value?",
    options,
    correctAnswer,
    answer: correctAnswer,
    explanation: `Concept\nInterest calculation.\n\nFormula / Reasoning\nUse the backend value.\n\nStep-by-Step Solution\nThe calculated value rounds to ${correctAnswer}.\n\nFinal Answer\n${correctAnswer}`,
    difficulty: "medium",
    topic: "interest",
    metadata: {
      topic: "interest",
      generationStrategy: "VARIABLE",
      variables: {
        answer: backendAnswer,
      },
    },
  });

  it("accepts LLM integer answers when backend computed answer has floating precision noise", () => {
    expect(() =>
      service.validate(
        getQuestion("637", 637.000835421888),
        "medium",
        "interest",
      ),
    ).not.toThrow();
  });

  it("keeps formatted correctAnswer exactly matched to one formatted option", () => {
    const question = getQuestion("637.01", 637.006, [
      "636.01",
      "637.01",
      "638.01",
      "639.01",
    ]);

    expect(question.options).toContain(question.correctAnswer);
    expect(() =>
      service.validate(question, "medium", "interest"),
    ).not.toThrow();
  });

  it("still rejects numeric answers outside tolerance", () => {
    expect(() =>
      service.validate(getQuestion("637", 637.02), "medium", "interest"),
    ).toThrow("Math validation failed");
  });

  it("still rejects non-numeric answer mismatches exactly", () => {
    expect(() =>
      service.validate(
        getQuestion("Option A", "Option B", [
          "Option A",
          "Option C",
          "Option D",
          "Option E",
        ]),
        "medium",
        "interest",
      ),
    ).toThrow("Math validation failed");
  });

  it("does not mutate raw metadata values", () => {
    const backendAnswer = 637.000835421888;
    const question = getQuestion("637", backendAnswer);

    service.validate(question, "medium", "interest");

    expect((question.metadata?.variables as any).answer).toBe(backendAnswer);
  });
});
