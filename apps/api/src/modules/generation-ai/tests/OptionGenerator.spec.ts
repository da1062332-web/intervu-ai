import { OptionGeneratorService } from "../generators/option-generator.service";

describe("OptionGeneratorService", () => {
  let service: OptionGeneratorService;

  beforeEach(() => {
    service = new OptionGeneratorService();
  });

  it("should validate and shuffle options successfully for MCQ", () => {
    const options = ["6", "8", "10", "12"];
    const correctAnswer = "8";

    const result = service.processOptions(options, correctAnswer, "mcq");

    expect(result.shuffledOptions.length).toBe(4);
    expect(result.shuffledOptions).toContain("8");
    expect(result.normalizedCorrectAnswer).toBe("8");
  });

  it("should throw error if options count is not 4 for MCQ", () => {
    const options = ["6", "8", "10"];
    const correctAnswer = "8";

    expect(() => service.processOptions(options, correctAnswer, "mcq")).toThrow(
      "MCQ options list must contain exactly 4 options",
    );
  });

  it("should throw error if options contain empty strings", () => {
    const options = ["6", "8", "", "12"];
    const correctAnswer = "8";

    expect(() => service.processOptions(options, correctAnswer, "mcq")).toThrow(
      "MCQ options cannot contain empty strings",
    );
  });

  it("should throw error if options contain duplicate values", () => {
    const options = ["6", "8", "8", "12"];
    const correctAnswer = "8";

    expect(() => service.processOptions(options, correctAnswer, "mcq")).toThrow(
      "MCQ options must not contain duplicate entries",
    );
  });

  it("should throw error if correctAnswer is not in options list", () => {
    const options = ["6", "8", "10", "12"];
    const correctAnswer = "14";

    expect(() => service.processOptions(options, correctAnswer, "mcq")).toThrow(
      'correctAnswer "14" must be present in the options list',
    );
  });

  it("should bypass shuffling for non-MCQ question types", () => {
    const result = service.processOptions([], "42", "numeric");
    expect(result.shuffledOptions).toEqual([]);
    expect(result.normalizedCorrectAnswer).toBe("42");
  });
});
