import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect } from "vitest";
import { RecommendationService } from "../../src/modules/evaluation/recommendations/recommendation.service";

describe("Recommendation Flow integration E2E", () => {
  it("should trigger recommendations with correct priority mapping and skill details", async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [RecommendationService],
    }).compile();

    const recommendationService = moduleFixture.get<RecommendationService>(
      RecommendationService,
    );

    // 1. Weak performer analytics
    const weakAnalytics = {
      topicAccuracy: {
        percentages: 30, // HIGH priority
        probability: 60, // MEDIUM priority
        verbal_analogy: 95, // No study plan
      },
      difficultyAccuracy: { EASY: 50, MEDIUM: 20, HARD: 0 },
      sectionAccuracy: { "General Section": 45 },
      completionRate: 80,
      attemptRate: 100,
    };

    const recs = recommendationService.generateRecommendations(weakAnalytics);

    expect(recs.length).toBe(2);

    const quantRec = recs.find((r) => r.title.includes("percentages"));
    expect(quantRec).toBeDefined();
    expect(quantRec?.priority).toBe("HIGH");
    expect(quantRec?.skill).toBe("aptitude");

    const logicRec = recs.find((r) => r.title.includes("probability"));
    expect(logicRec).toBeDefined();
    expect(logicRec?.priority).toBe("MEDIUM");
    expect(logicRec?.skill).toBe("reasoning");
  });
});
