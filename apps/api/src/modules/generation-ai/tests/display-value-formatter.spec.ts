import {
  formatDisplayString,
  normalizeDisplayQuestion,
  synthesizeNumericDistractors,
} from "../utils/display-value-formatter";

describe("display value formatter", () => {
  it("preserves integer display", () => {
    expect(formatDisplayString(10000)).toBe("10000");
    expect(formatDisplayString("10000")).toBe("10000");
  });

  it("formats long decimal display values", () => {
    expect(formatDisplayString("Answer is 342.02564102564105")).toBe(
      "Answer is 342.03",
    );
    expect(formatDisplayString("Value 3245.4016875000007")).toBe(
      "Value 3245.40",
    );
  });

  it("preserves fractions, ratios, and short decimal strings", () => {
    expect(formatDisplayString("Use 1/3 or 13339/39")).toBe(
      "Use 1/3 or 13339/39",
    );
    expect(formatDisplayString("The ratio is 3:2 and value is 4.5")).toBe(
      "The ratio is 3:2 and value is 4.5",
    );
    expect(formatDisplayString("Already clean 12.34")).toBe(
      "Already clean 12.34",
    );
  });

  it("preserves existing currency-style rounding", () => {
    expect(formatDisplayString("Interest is Rs. 3245.4016875000007")).toBe(
      "Interest is Rs. 3245",
    );
  });

  it("normalizes options and correct answer together", () => {
    const rawVariables = { value: 342.02564102564105 };
    const normalized = normalizeDisplayQuestion({
      question: "Find 342.02564102564105",
      options: ["342.02564102564105", "341.02564102564105", "1/3", "3:2"],
      correctAnswer: "342.02564102564105",
      answer: "342.02564102564105",
      explanation: "Final Answer 342.02564102564105",
      metadata: { variables: rawVariables },
    });

    expect(normalized.options).toContain("342.03");
    expect(normalized.correctAnswer).toBe("342.03");
    expect(normalized.answer).toBe("342.03");
    expect(normalized.explanation).toContain("342.03");
    expect(normalized.metadata.variables).toBe(rawVariables);
  });

  it("synthesizes 4 valid numeric distractors with identical precision", () => {
    const options = synthesizeNumericDistractors(74.67195767195767);
    expect(options.length).toBe(4);
    expect(options).toContain("74.67");
    // Verify all options have at most 2 decimal places and no 10+ digit floats
    for (const opt of options) {
      expect(opt).toMatch(/^-?\d+(\.\d{1,2})?$/);
    }
  });

  it("replaces placeholder 'Option A-D' with real numeric options if answer is numeric", () => {
    const normalized = normalizeDisplayQuestion({
      questionText: "If 61% of a number is 479, what is the value of the number?",
      options: ["Option A", "Option B", "Option C", "Option D"],
      answer: "785.2459016393443",
    });

    expect(normalized.options?.length).toBe(4);
    expect(normalized.options).not.toContain("Option A");
    expect(normalized.options).toContain("785.25");
    expect(normalized.answer).toBe("785.25");
  });
});

