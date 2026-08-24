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

  it("should validate long multi-part parajumble answer when explanation references sequence letters or key segments", () => {
    const explanation = `
      Concept:
      Logical sentence rearrangement and coherence.

      Formula / Reasoning:
      Sentence C introduces the main topic, sentence A connects with not only, sentence B provides the but also continuation, and sentence D completes the thought.

      Step-by-Step Solution:
      Step 1: Sentence C starts the paragraph.
      Step 2: Sentence A follows C logically.
      Step 3: Sentence B and D complete the sentence.

      Final Answer:
      The correct order is CABD.
    `;
    const correctAnswer =
      "C. increases productivity levels / A. not only facilitates clear communication / B. but also strengthens relationships / D. within the organization";

    expect(() =>
      service.validateExplanation(explanation, correctAnswer),
    ).not.toThrow();
  });
});
