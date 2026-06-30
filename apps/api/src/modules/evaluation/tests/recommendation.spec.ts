import { RecommendationService } from "../recommendations/recommendation.service";
import { PerformanceAnalyticsDto } from "@intervu-ai/contracts";

describe("RecommendationService Unit Tests", () => {
  let service: RecommendationService;

  beforeEach(() => {
    service = new RecommendationService();
  });

  it("should generate appropriate priority recommendations based on accuracy levels", () => {
    const analytics: PerformanceAnalyticsDto = {
      topicAccuracy: {
        Percentages: 40, // < 50% -> HIGH priority
        Probability: 60, // >= 50% and < 75% -> MEDIUM priority
        "Time and Work": 80, // >= 75% -> no recommendation
      },
      difficultyAccuracy: {},
      sectionAccuracy: {},
      completionRate: 100,
      attemptRate: 100,
    };

    const recommendations = service.generateRecommendations(analytics);

    expect(recommendations.length).toBe(2);

    const percentageRec = recommendations.find((r) =>
      r.title.includes("Percentages"),
    );
    const probabilityRec = recommendations.find((r) =>
      r.title.includes("Probability"),
    );

    expect(percentageRec).toBeDefined();
    expect(percentageRec?.priority).toBe("HIGH");
    expect(percentageRec?.skill).toBe("aptitude");

    expect(probabilityRec).toBeDefined();
    expect(probabilityRec?.priority).toBe("MEDIUM");
    expect(probabilityRec?.skill).toBe("reasoning");
  });

  it("should generate fallback maintain-excellence recommendation when all topics are above 75%", () => {
    const analytics: PerformanceAnalyticsDto = {
      topicAccuracy: {
        Percentages: 85,
        "Time and Work": 90,
      },
      difficultyAccuracy: {},
      sectionAccuracy: {},
      completionRate: 100,
      attemptRate: 100,
    };

    const recommendations = service.generateRecommendations(analytics);

    expect(recommendations.length).toBe(1);
    expect(recommendations[0].title).toBe("Maintain Excellence");
    expect(recommendations[0].priority).toBe("LOW");
  });
});
