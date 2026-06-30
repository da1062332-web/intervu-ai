import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../../prisma/prisma.service";
import { ObjectiveEvaluatorService } from "../objective/objective-evaluator.service";
import { SectionScoringService } from "../scoring/section-scoring.service";
import { OverallScoreService } from "../scoring/overall-score.service";
import { PerformanceAnalyticsService } from "../analytics/performance-analytics.service";
import { StrengthWeaknessService } from "../analytics/strength-weakness.service";
import { RecommendationService } from "../recommendations/recommendation.service";
import { ResultGeneratorService } from "../services/result-generator.service";
import { ResultStorageService } from "../services/result-storage.service";
import { ExecutionEvaluationIntegration } from "../integrations/execution-evaluation.integration";
import { ExecutionResultDto } from "../../execution/dto/execution-result.dto";

describe("Evaluation Module Integration Tests", () => {
  let module: TestingModule;
  let integration: ExecutionEvaluationIntegration;
  let prisma: PrismaService;

  const mockTestInstance = {
    id: "attempt_123",
    userId: "candidate_456",
    sections: [
      {
        id: "section_1",
        sectionKey: "sec_math",
        sectionName: "Mathematics",
        orderIndex: 0,
        questions: [
          {
            questionId: "q1",
            questionOrder: 0,
            questionSnapshot: {
              answer: "A",
              type: "MCQ",
              difficulty: "EASY",
              conceptKey: "percentages",
            },
          },
          {
            questionId: "q2",
            questionOrder: 1,
            questionSnapshot: {
              answer: "B,C",
              type: "MSQ",
              difficulty: "MEDIUM",
              conceptKey: "probability",
            },
          },
        ],
      },
    ],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prismaMock: any = {
    testInstance: {
      findUnique: jest.fn().mockResolvedValue(mockTestInstance),
    },
    candidateResult: {
      upsert: jest.fn().mockResolvedValue({}),
    },
    evaluationAnalytics: {
      upsert: jest.fn().mockResolvedValue({}),
    },
    submission: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    evaluationRun: {
      create: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn((cb) => cb(prismaMock)),
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        ResultGeneratorService,
        ResultStorageService,
        ObjectiveEvaluatorService,
        SectionScoringService,
        OverallScoreService,
        PerformanceAnalyticsService,
        StrengthWeaknessService,
        RecommendationService,
        ExecutionEvaluationIntegration,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    integration = module.get(ExecutionEvaluationIntegration);
    prisma = module.get(PrismaService);
  });

  it("should process submission, evaluate it and save results cleanly", async () => {
    const executionResult: ExecutionResultDto = {
      executionId: "sub_999",
      testId: "attempt_123",
      status: "submitted",
      submittedAt: new Date(),
      answers: [
        {
          questionId: "q1",
          answer: "A", // Correct MCQ
          timeSpentSeconds: 15,
        },
        {
          questionId: "q2",
          answer: '["B", "C"]', // Correct MSQ
          timeSpentSeconds: 35,
        },
      ],
    };

    await expect(
      integration.triggerEvaluation(executionResult),
    ).resolves.not.toThrow();

    // Verify correct DB operations executed
    expect(prisma.testInstance.findUnique).toHaveBeenCalledWith({
      where: { id: "attempt_123" },
      include: expect.any(Object),
    });

    expect(prisma.candidateResult.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          candidateId: "candidate_456",
          attemptId: "attempt_123",
          score: 2, // Both correct
          percentage: 100,
        }),
      }),
    );

    expect(prisma.evaluationAnalytics.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          attemptId: "attempt_123",
          completionRate: 100,
          attemptRate: 100,
        }),
      }),
    );

    expect(prisma.submission.updateMany).toHaveBeenCalledWith({
      where: { testInstanceId: "attempt_123" },
      data: expect.objectContaining({
        status: "EVALUATED",
      }),
    });

    expect(prisma.evaluationRun.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        attemptId: "attempt_123",
        status: "COMPLETED",
      }),
    });
  });
});
