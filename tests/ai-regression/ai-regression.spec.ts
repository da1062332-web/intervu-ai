import { describe, it, expect, vi, beforeAll } from "vitest";
import { ObjectiveEvaluatorService } from "../../apps/api/src/modules/evaluation/objective/objective-evaluator.service";
import { SectionScoringService } from "../../apps/api/src/modules/evaluation/scoring/section-scoring.service";
import { OverallScoreService } from "../../apps/api/src/modules/evaluation/scoring/overall-score.service";
import { PerformanceAnalyticsService } from "../../apps/api/src/modules/evaluation/analytics/performance-analytics.service";
import { RecommendationService } from "../../apps/api/src/modules/evaluation/recommendations/recommendation.service";
import { TopicMasteryService } from "../../apps/api/src/modules/evaluation/analytics/topic-mastery.service";
import { EvaluationExplainabilityService } from "../../apps/api/src/modules/evaluation/insights/explainability.service";
import { BenchmarkService } from "../../apps/api/src/modules/evaluation/benchmarking/benchmark.service";
import { CandidateRankingService } from "../../apps/api/src/modules/evaluation/ranking/candidate-ranking.service";
import { AnswerDto } from "@intervu-ai/contracts";

describe("AI Regression Test Suite", () => {
  const evaluator = new ObjectiveEvaluatorService();
  const sectionScoring = new SectionScoringService();
  const overallScoring = new OverallScoreService();
  const analytics = new PerformanceAnalyticsService();
  const recommendation = new RecommendationService();
  const mastery = new TopicMasteryService();

  const mockQuestions = [
    {
      id: "q1",
      answer: "OptionA",
      questionType: "MCQ",
      difficulty: "EASY",
      topicName: "percentages",
      sectionKey: "sec1",
    },
    {
      id: "q2",
      answer: "OptionA,OptionB",
      questionType: "MSQ",
      difficulty: "MEDIUM",
      topicName: "time_work",
      sectionKey: "sec1",
    },
    {
      id: "q3",
      answer: "true",
      questionType: "TrueFalse",
      difficulty: "HARD",
      topicName: "probability",
      sectionKey: "sec2",
    },
    {
      id: "q4",
      answer: "10.0",
      questionType: "Numeric",
      difficulty: "MEDIUM",
      topicName: "averages",
      sectionKey: "sec2",
    },
  ];

  const parsedSections = [
    {
      id: "sec1",
      sectionKey: "sec1",
      sectionName: "Section 1",
      questions: [{ questionId: "q1" }, { questionId: "q2" }],
    },
    {
      id: "sec2",
      sectionKey: "sec2",
      sectionName: "Section 2",
      questions: [{ questionId: "q3" }, { questionId: "q4" }],
    },
  ];

  it("1. Evaluation Scoring: Deterministic grading of candidate submissions", () => {
    // Attempt 1: All correct
    const answers1: AnswerDto[] = [
      {
        questionId: "q1",
        selectedOptionId: "OptionA",
        timeSpentSeconds: 15,
        status: "ANSWERED",
      },
      {
        questionId: "q2",
        selectedOptionIds: ["OptionB", "OptionA"],
        timeSpentSeconds: 20,
        status: "ANSWERED",
      }, // MSQ unsorted
      {
        questionId: "q3",
        selectedOptionId: "TRUE",
        timeSpentSeconds: 10,
        status: "ANSWERED",
      }, // TrueFalse case mismatch
      {
        questionId: "q4",
        textResponse: "10.00003",
        timeSpentSeconds: 25,
        status: "ANSWERED",
      }, // Numeric within tolerance
    ];

    const eval1 = evaluator.evaluateAnswers(answers1, mockQuestions);
    expect(eval1[0].isCorrect).toBe(true);
    expect(eval1[1].isCorrect).toBe(true);
    expect(eval1[2].isCorrect).toBe(true);
    expect(eval1[3].isCorrect).toBe(true);

    const secScores1 = sectionScoring.calculateSectionScores(
      eval1,
      parsedSections,
    );
    const overall1 = overallScoring.calculateOverallScore(secScores1);
    expect(overall1.percentage).toBe(100);
    expect(overall1.accuracy).toBe(100);

    // Attempt 2: Partial correct and skipped
    const answers2: AnswerDto[] = [
      {
        questionId: "q1",
        selectedOptionId: "OptionA",
        timeSpentSeconds: 10,
        status: "ANSWERED",
      },
      {
        questionId: "q2",
        selectedOptionIds: ["OptionWrong"],
        timeSpentSeconds: 15,
        status: "ANSWERED",
      },
      { questionId: "q3", status: "SKIPPED" }, // skipped
      {
        questionId: "q4",
        textResponse: "10.5",
        timeSpentSeconds: 12,
        status: "ANSWERED",
      }, // numeric out of tolerance
    ];

    const eval2 = evaluator.evaluateAnswers(answers2, mockQuestions);
    expect(eval2[0].isCorrect).toBe(true);
    expect(eval2[1].isCorrect).toBe(false);
    expect(eval2[2].isCorrect).toBe(false);
    expect(eval2[3].isCorrect).toBe(false);

    const secScores2 = sectionScoring.calculateSectionScores(
      eval2,
      parsedSections,
    );
    const overall2 = overallScoring.calculateOverallScore(secScores2);
    expect(overall2.percentage).toBe(25);
  });

  it("2. Recommendation Triggers: Low accuracy detection and mapping", () => {
    // Generate recommendation mock analytics
    const mockAnalytics = {
      topicAccuracy: { percentages: 100, time_work: 50, probability: 30 },
      difficultyAccuracy: { EASY: 100, MEDIUM: 50, HARD: 30 },
      sectionAccuracy: { "Section 1": 75, "Section 2": 30 },
      completionRate: 75,
      attemptRate: 75,
    };

    const recs = recommendation.generateRecommendations(mockAnalytics);
    // Should trigger recommendations for topics with accuracy < 75%
    expect(recs.length).toBeGreaterThan(0);

    const triggeredTopics = recs.map((r) => r.title);
    expect(triggeredTopics).toContain("Improve time_work");
    expect(triggeredTopics).toContain("Improve probability");
    expect(triggeredTopics).not.toContain("Improve percentages");

    // All should be marked with proper skill associations
    recs.forEach((r) => {
      expect(r.skill).toBeDefined();
      expect(r.priority).toMatch(/HIGH|MEDIUM/);
    });
  });

  it("3. Topic Mastery: Names matching 'Needs Improvement' and bounds", () => {
    const accuracyMapping = {
      math: 95,
      reasoning: 80,
      verbal: 65,
      general: 30,
    };

    const levels = mastery.calculateTopicMastery(accuracyMapping);
    expect(levels.math).toBe("Mastered");
    expect(levels.reasoning).toBe("Proficient");
    expect(levels.verbal).toBe("Developing");
    expect(levels.general).toBe("Needs Improvement"); // Renamed from "Weak"
  });

  it("4. Explainability Layer: Structured explanations are traceable", async () => {
    const mockPrisma = {
      candidateRanking: {
        findUnique: vi.fn().mockResolvedValue({
          assessmentRank: 2,
          totalAssessmentCandidates: 10,
          percentile: 85.0,
        }),
      },
    } as any;

    const mockBenchmark = {
      getBenchmark: vi.fn().mockResolvedValue({
        assessmentAverage: 70,
      }),
    } as any;

    const explainability = new EvaluationExplainabilityService(
      mockPrisma,
      mockBenchmark,
    );

    const mockResult = {
      id: "res1",
      candidateId: "usr1",
      attemptId: "att1",
      score: 8,
      percentage: 80,
      createdAt: new Date(),
      sections: [
        {
          sectionKey: "sec1",
          sectionName: "Section 1",
          correct: 2,
          incorrect: 0,
          skipped: 0,
          marks: 2,
          accuracy: 100,
        },
      ],
      recommendations: [
        {
          recommendationId: "rec1",
          skill: "aptitude",
          priority: "MEDIUM" as const,
          title: "Improve Percentages",
          description: "Study hard.",
        },
      ],
    };

    const explanations = await explainability.getExplanation(
      "att1",
      mockResult,
    );
    expect(explanations.scoreExplanation).toContain("score of 80%");
    expect(explanations.recommendationReason).toContain("Percentages");
    expect(explanations.benchmarkReason).toContain(
      "higher than the cohort average of 70%",
    );
    expect(explanations.rankingReason).toContain(
      "ranked #2 out of 10 candidates",
    );
  });
});
