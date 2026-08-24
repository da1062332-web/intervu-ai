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

  it("should validate and shuffle options successfully for MULTIPLE_CHOICE", () => {
    const options = ["6", "8", "10", "12"];
    const correctAnswer = "8";

    const result = service.processOptions(
      options,
      correctAnswer,
      "MULTIPLE_CHOICE",
    );

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

  it("should auto-heal single-string multi-line options", () => {
    const options = ["A) 10 km/h\nB) 20 km/h\nC) 30 km/h\nD) 40 km/h"];
    const correctAnswer = "B";

    const result = service.processOptions(options, correctAnswer, "mcq");
    expect(result.shuffledOptions.length).toBe(4);
    expect(result.shuffledOptions).toContain("20 km/h");
    expect(result.normalizedCorrectAnswer).toBe("20 km/h");
  });

  it("should auto-heal object-formatted options", () => {
    const options = { A: "10", B: "20", C: "30", D: "40" } as any;
    const correctAnswer = "Option C";

    const result = service.processOptions(options, correctAnswer, "mcq");
    expect(result.shuffledOptions.length).toBe(4);
    expect(result.shuffledOptions).toContain("30");
    expect(result.normalizedCorrectAnswer).toBe("30");
  });

  it("should strip option labels and resolve matching letter correct answer", () => {
    const options = ["A) 6 km/h", "B) 8 km/h", "C) 10 km/h", "D) 12 km/h"];
    const correctAnswer = "B) 8 km/h";

    const result = service.processOptions(options, correctAnswer, "mcq");
    expect(result.shuffledOptions.length).toBe(4);
    expect(result.shuffledOptions).toContain("8 km/h");
    expect(result.normalizedCorrectAnswer).toBe("8 km/h");
  });

  it("should auto-trim 5-option array to 4 options while preserving the correct answer", () => {
    const options = ["10", "20", "30", "40", "50"];
    const correctAnswer = "50";

    const result = service.processOptions(options, correctAnswer, "mcq");
    expect(result.shuffledOptions.length).toBe(4);
    expect(result.shuffledOptions).toContain("50");
    expect(result.normalizedCorrectAnswer).toBe("50");
  });

  it("should auto-heal sequence-code answer when options are sentence fragments (sentence rearrangement)", () => {
    // AI sends sentence pieces in options, but sequence code in correctAnswer
    const options = [
      "after finishing the project /",
      "the team members /",
      "celebrated their success /",
      "at a local restaurant",
    ];
    const correctAnswer = "B-A-C-D";

    const result = service.processOptions(options, correctAnswer, "mcq");
    expect(result.shuffledOptions.length).toBe(4);
    expect(result.shuffledOptions).toContain("B-A-C-D");
    expect(result.normalizedCorrectAnswer).toBe("B-A-C-D");
  });

  it("should preserve W-X-Y-Z sequence code options without stripping leading characters", () => {
    const options = ["W-X-Y-Z", "X-W-Y-Z", "Z-Y-W-X", "Y-Z-W-X"];
    const correctAnswer = "W-X-Y-Z";

    const result = service.processOptions(options, correctAnswer, "mcq");
    expect(result.shuffledOptions.length).toBe(4);
    expect(result.shuffledOptions).toContain("W-X-Y-Z");
    expect(result.shuffledOptions).toContain("X-W-Y-Z");
    expect(result.shuffledOptions).toContain("Z-Y-W-X");
    expect(result.shuffledOptions).toContain("Y-Z-W-X");
    expect(result.normalizedCorrectAnswer).toBe("W-X-Y-Z");
  });

  it("should deduplicate sequence code options when duplicates exist in array", () => {
    const options = ["W-X-Y-Z", "X-W-Y-Z", "W-X-Y-Z", "Z-Y-W-X"]; // contains duplicate W-X-Y-Z
    const correctAnswer = "W-X-Y-Z";

    const result = service.processOptions(options, correctAnswer, "mcq");
    expect(result.shuffledOptions.length).toBe(4);
    const uniqueOptions = new Set(result.shuffledOptions);
    expect(uniqueOptions.size).toBe(4);
    expect(result.shuffledOptions).toContain("W-X-Y-Z");
    expect(result.normalizedCorrectAnswer).toBe("W-X-Y-Z");
  });
});
