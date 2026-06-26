import { StructureAnalyzerService } from "../analyzers/structure-analyzer.service";

describe("StructureAnalyzerService", () => {
  let service: StructureAnalyzerService;

  beforeEach(() => {
    service = new StructureAnalyzerService();
  });

  it("should return score 100 for a perfectly formed question", async () => {
    const res = await service.analyze({
      questionText: "What is 2 + 2?",
      answer: "4",
      explanation: "Basic math explanation",
      options: ["3", "4", "5", "6"],
    });

    expect(res.isValid).toBe(true);
    expect(res.score).toBe(100);
    expect(res.issues.length).toBe(0);
  });

  it("should flag missing fields and deduct scores", async () => {
    const res = await service.analyze({
      questionText: "",
      answer: "",
      explanation: "",
      options: null,
    });

    expect(res.isValid).toBe(false);
    expect(res.score).toBe(20);
    expect(res.issues).toContain("Question text is empty or missing");
    expect(res.issues).toContain("Correct answer is empty or missing");
    expect(res.issues).toContain("Explanation is empty or missing");
    expect(res.issues).toContain("Options are missing");
  });

  it("should flag mismatching answer or missing choices", async () => {
    const res = await service.analyze({
      questionText: "What is the capital of India?",
      answer: "Delhi",
      explanation: "Delhi is the capital.",
      options: ["London", "Paris"],
    });

    expect(res.isValid).toBe(false);
    expect(res.score).toBe(80);
    expect(res.issues).toContain("The correct answer does not match any of the provided options");
  });
});
