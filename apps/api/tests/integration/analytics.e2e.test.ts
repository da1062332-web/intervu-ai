import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect } from "vitest";
import { PerformanceAnalyticsService } from "../../src/modules/evaluation/analytics/performance-analytics.service";
import { TopicMasteryService } from "../../src/modules/evaluation/analytics/topic-mastery.service";

describe("Analytics & Topic Mastery integration E2E", () => {
  it("should calculate accuracy values and transform them to Topic Mastery levels", async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [PerformanceAnalyticsService, TopicMasteryService],
    }).compile();

    const analyticsService = moduleFixture.get<PerformanceAnalyticsService>(PerformanceAnalyticsService);
    const masteryService = moduleFixture.get<TopicMasteryService>(TopicMasteryService);

    // 1. Mock evaluated question results
    const evalResults = [
      { questionId: "q1", isCorrect: true, score: 1, maxMarks: 1, candidateAnswer: "OptionA", correctAnswer: "OptionA", timeSpentSeconds: 15 },
      { questionId: "q2", isCorrect: false, score: 0, maxMarks: 1, candidateAnswer: "OptionB", correctAnswer: "OptionA", timeSpentSeconds: 10 },
      { questionId: "q3", isCorrect: true, score: 1, maxMarks: 1, candidateAnswer: "OptionC", correctAnswer: "OptionC", timeSpentSeconds: 12 },
      { questionId: "q4", isCorrect: false, score: 0, maxMarks: 1, candidateAnswer: "OptionD", correctAnswer: "OptionC", timeSpentSeconds: 20 },
    ];

    const questions = [
      { id: "q1", answer: "OptionA", questionType: "MCQ", difficulty: "EASY", topicName: "percentages", sectionKey: "sec1" },
      { id: "q2", answer: "OptionB", questionType: "MCQ", difficulty: "MEDIUM", topicName: "percentages", sectionKey: "sec1" },
      { id: "q3", answer: "OptionC", questionType: "MCQ", difficulty: "HARD", topicName: "probability", sectionKey: "sec2" },
      { id: "q4", answer: "OptionD", questionType: "MCQ", difficulty: "MEDIUM", topicName: "probability", sectionKey: "sec2" },
    ];

    // 2. Run performance analytics
    const analytics = analyticsService.calculateAnalytics(evalResults, questions);

    expect(analytics).toBeDefined();
    expect(analytics.topicAccuracy.percentages).toBe(50);
    expect(analytics.topicAccuracy.probability).toBe(50);
    expect(analytics.difficultyAccuracy.EASY).toBe(100);
    expect(analytics.difficultyAccuracy.HARD).toBe(100);

    // 3. Map topic accuracy to topic mastery levels
    const masteryLevels = masteryService.calculateTopicMastery(analytics.topicAccuracy);
    expect(masteryLevels.percentages).toBe("Developing"); // 50% -> Developing
    expect(masteryLevels.probability).toBe("Developing");
  });
});
