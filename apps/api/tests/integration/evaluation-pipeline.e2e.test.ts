import { Test, TestingModule } from "@nestjs/testing";
import { describe, it, expect, vi } from "vitest";
import { ResultGeneratorService } from "../../src/modules/evaluation/services/result-generator.service";
import { ObjectiveEvaluatorService } from "../../src/modules/evaluation/objective/objective-evaluator.service";
import { SectionScoringService } from "../../src/modules/evaluation/scoring/section-scoring.service";
import { OverallScoreService } from "../../src/modules/evaluation/scoring/overall-score.service";
import { PerformanceAnalyticsService } from "../../src/modules/evaluation/analytics/performance-analytics.service";
import { RecommendationService } from "../../src/modules/evaluation/recommendations/recommendation.service";
import { TopicMasteryService } from "../../src/modules/evaluation/analytics/topic-mastery.service";
import { StrengthWeaknessService } from "../../src/modules/evaluation/analytics/strength-weakness.service";
import { ResultStorageService } from "../../src/modules/evaluation/services/result-storage.service";
import { PrismaService } from "../../src/prisma/prisma.service";

describe("Evaluation Pipeline integration E2E Flow", () => {
  it("should execute the E2E grading pipeline: submission -> score -> analytics -> recommendations -> explainability", async () => {
    // 1. Mock DB data
    const mockTestInstance = {
      id: "attempt_1",
      userId: "usr_1",
      testConfigId: "cfg_1",
      status: "COMPLETED",
      submittedAt: new Date(),
      candidateResult: { id: "res_1", percentage: 80, score: 8, createdAt: new Date() },
      evaluationAnalytics: {
        id: "ea_1",
        sectionAccuracy: { "Math Section": 100 },
        topicAccuracy: { percentages: 100 },
        difficultyAccuracy: { EASY: 100 },
      },
      sections: [
        {
          id: "sec_1",
          sectionKey: "sec_math",
          sectionName: "Math Section",
          questions: [
            {
              questionId: "q_1",
              questionSnapshot: {
                answer: "OptionA",
                questionType: "MCQ",
                difficulty: "EASY",
                topic: { name: "percentages" },
              },
            },
          ],
        },
      ],
    };

    const mockPrisma = {
      testInstance: {
        findUnique: vi.fn().mockResolvedValue(mockTestInstance),
      },
      candidateResult: {
        aggregate: vi.fn().mockResolvedValue({ _avg: { percentage: 70 }, _count: { id: 10 } }),
        findUnique: vi.fn().mockResolvedValue({ id: "res_1", percentage: 80, score: 8, attemptId: "attempt_1", createdAt: new Date() }),
        groupBy: vi.fn().mockResolvedValue([{ percentage: 80, _count: { id: 1 } }]),
      },
      evaluationAnalytics: {
        findMany: vi.fn().mockResolvedValue([]),
        upsert: vi.fn().mockResolvedValue({}),
      },
      candidateRanking: {
        findUnique: vi.fn().mockResolvedValue({ assessmentRank: 2, totalAssessmentCandidates: 10, percentile: 80.0 }),
      },
      evaluationInsight: {
        upsert: vi.fn().mockResolvedValue({}),
      },
      $queryRawUnsafe: vi.fn().mockResolvedValue([]),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        ResultGeneratorService,
        ObjectiveEvaluatorService,
        SectionScoringService,
        OverallScoreService,
        PerformanceAnalyticsService,
        RecommendationService,
        TopicMasteryService,
        StrengthWeaknessService,
        {
          provide: ResultStorageService,
          useValue: { saveResult: vi.fn().mockResolvedValue({}) },
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    const generator = moduleFixture.get<ResultGeneratorService>(ResultGeneratorService);

    // 2. Mock submission input
    const executionResult = {
      executionId: "attempt_1",
      testId: "attempt_1",
      status: "submitted",
      submittedAt: new Date(),
      answers: [
        {
          questionId: "q_1",
          answer: "OptionA",
          timeSpentSeconds: 15,
        },
      ],
    };

    // 3. Trigger evaluation generator pipeline
    const result = await generator.generateResult(executionResult);

    expect(result).toBeDefined();
    expect(result.score).toBe(1);
    expect(result.percentage).toBe(100);
    expect(result.sections!.length).toBe(1);
    expect(result.sections![0].accuracy).toBe(100);
    expect(result.analytics!.completionRate).toBe(100);
    expect(result.recommendations!.length).toBe(1);
    expect(result.recommendations![0].title).toBe("Maintain Excellence");
  });
});
