import { DifficultyAnalyzerService } from "../analyzers/difficulty-analyzer.service";

describe("DifficultyAnalyzerService", () => {
  let service: DifficultyAnalyzerService;

  beforeEach(() => {
    service = new DifficultyAnalyzerService();
  });

  it("should estimate EASY difficulty for short and simple questions", async () => {
    const res = await service.analyze({
      requestedDifficulty: "EASY",
      generatedQuestion: {
        questionText: "What is addition?",
        answer: "Adding numbers together",
        explanation: "Simple math addition operation",
      },
    });

    expect(res.actual).toBe("EASY");
    expect(res.expected).toBe("EASY");
    expect(res.confidence).toBe(0.85);
  });

  it("should estimate HARD difficulty for long questions containing advanced keywords", async () => {
    const res = await service.analyze({
      requestedDifficulty: "HARD",
      generatedQuestion: {
        questionText:
          "Explain dynamic programming algorithms for time complexity calculation.",
        answer: "Complexity is optimized",
        explanation:
          "Recursion with memoization solves overlapping subproblems",
      },
    });

    expect(res.actual).toBe("HARD");
    expect(res.expected).toBe("HARD");
    expect(res.confidence).toBe(0.85);
  });

  it("should flag mismatching difficulty with lower confidence", async () => {
    const res = await service.analyze({
      requestedDifficulty: "EASY",
      generatedQuestion: {
        questionText:
          "Implement a recursion algorithm to traverse a binary search tree in dynamic programming.",
        answer: "O(log N)",
        explanation: "Asynchronous concurrent calls optimize the runtime stack",
      },
    });

    expect(res.actual).toBe("HARD");
    expect(res.expected).toBe("EASY");
    expect(res.confidence).toBe(0.65);
  });
});
