import { OptionGeneratorService } from "../generators/option-generator.service";

describe("OptionGeneratorService", () => {
  let service: OptionGeneratorService;

  beforeEach(() => {
    service = new OptionGeneratorService();
  });

  it("should validate and shuffle options successfully for MCQ", () => {
    const options = ["Option A", "Option B", "Option C", "Option D"];
    const correctAnswer = "Option B";

    const result = service.processOptions(options, correctAnswer, "mcq");

    expect(result.shuffledOptions.length).toBe(4);
    expect(result.shuffledOptions).toContain("Option B");
    expect(result.normalizedCorrectAnswer).toBe("Option B");
  });

  it("should throw error if options count is not 4 for MCQ", () => {
    const options = ["Option A", "Option B", "Option C"];
    const correctAnswer = "Option B";

    expect(() =>
      service.processOptions(options, correctAnswer, "mcq"),
    ).toThrow("MCQ options list must contain exactly 4 options");
  });

  it("should throw error if options contain empty strings", () => {
    const options = ["Option A", "Option B", "", "Option D"];
    const correctAnswer = "Option B";

    expect(() =>
      service.processOptions(options, correctAnswer, "mcq"),
    ).toThrow("MCQ options cannot contain empty strings");
  });

  it("should throw error if options contain duplicate values", () => {
    const options = ["Option A", "Option B", "Option B", "Option D"];
    const correctAnswer = "Option B";

    expect(() =>
      service.processOptions(options, correctAnswer, "mcq"),
    ).toThrow("MCQ options must not contain duplicate entries");
  });

  it("should throw error if correctAnswer is not in options list", () => {
    const options = ["Option A", "Option B", "Option C", "Option D"];
    const correctAnswer = "Option E";

    expect(() =>
      service.processOptions(options, correctAnswer, "mcq"),
    ).toThrow("correctAnswer \"Option E\" must be present in the options list");
  });

  it("should bypass shuffling for non-MCQ question types", () => {
    const result = service.processOptions([], "42", "numeric");
    expect(result.shuffledOptions).toEqual([]);
    expect(result.normalizedCorrectAnswer).toBe("42");
  });
});
