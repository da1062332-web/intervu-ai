import { TopicMasteryService } from "../analytics/topic-mastery.service";

describe("TopicMasteryService Unit Tests", () => {
  let service: TopicMasteryService;

  beforeEach(() => {
    service = new TopicMasteryService();
  });

  it("should classify topic mastery levels accurately across all threshold bounds", () => {
    const accuracyMapping = {
      quant: 95,      // >= 90 -> Mastered
      verbal: 80,     // 75 to 89 -> Proficient
      logic: 65,      // 50 to 74 -> Developing
      general: 40,    // < 50 -> Needs Improvement
    };

    const result = service.calculateTopicMastery(accuracyMapping);

    expect(result.quant).toBe("Mastered");
    expect(result.verbal).toBe("Proficient");
    expect(result.logic).toBe("Developing");
    expect(result.general).toBe("Needs Improvement"); // Enforces renamed Weak -> Needs Improvement SLA
  });
});
