import { ExplanationGeneratorService } from "../generators/explanation-generator.service";

describe("ExplanationGeneratorService", () => {
  let service: ExplanationGeneratorService;

  beforeEach(() => {
    service = new ExplanationGeneratorService();
  });

  it("should validate a correctly formatted explanation successfully", () => {
    const explanation = `
      Concept:
      Math addition of variables.

      Formula / Reasoning:
      The total is sum = a + b.

      Step-by-Step Solution:
      Step 1: take a = 5.
      Step 2: take b = 7.
      Step 3: add 5 + 7 = 12.

      Final Answer:
      12
    `;
    const correctAnswer = "12";

    expect(() =>
      service.validateExplanation(explanation, correctAnswer),
    ).not.toThrow();
  });

  it("should throw error if any required section heading is missing", () => {
    const explanation = `
      Concept:
      Math addition of variables.

      Step-by-Step Solution:
      Step 1: add 5 + 7 = 12.

      Final Answer:
      12
    `;
    const correctAnswer = "12";

    expect(() =>
      service.validateExplanation(explanation, correctAnswer),
    ).toThrow(
      "Explanation is missing required section headings: Formula / Reasoning",
    );
  });

  it("should throw error if correctAnswer is not referenced in explanation", () => {
    const explanation = `
      Concept:
      Math addition of variables.

      Formula / Reasoning:
      The total is sum = a + b.

      Step-by-Step Solution:
      Step 1: add 5 + 7 = 12.

      Final Answer:
      12
    `;
    const correctAnswer = "99"; // answer not in explanation

    expect(() =>
      service.validateExplanation(explanation, correctAnswer),
    ).toThrow("Explanation alignment check failed");
  });
});
