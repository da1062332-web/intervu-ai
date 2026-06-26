import { TopicAnalyzerService } from "../analyzers/topic-analyzer.service";

describe("TopicAnalyzerService", () => {
  let service: TopicAnalyzerService;

  beforeEach(() => {
    service = new TopicAnalyzerService();
  });

  it("should validate matching topics successfully", async () => {
    const res = await service.analyze({
      requestedTopic: "Percentages",
      questionText: "What is 20 percent of 80?",
      explanation: "20% ratio is 20/100 * 80",
    });

    expect(res.match).toBe(true);
    expect(res.requested).toBe("Percentages");
    expect(res.actual).toBe("Percentages");
  });

  it("should fail when content does not align with topic", async () => {
    const res = await service.analyze({
      requestedTopic: "Percentages",
      questionText:
        "A fair die is rolled. Find the probability of getting an even number.",
      explanation:
        "Total options are 6, even options are 2, 4, 6. Probability is 3/6 = 0.5.",
    });

    expect(res.match).toBe(false);
    expect(res.actual).toBe("Probability");
  });
});
