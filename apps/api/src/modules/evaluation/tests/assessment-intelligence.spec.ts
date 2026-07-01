import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { EvaluationController } from "../controllers/evaluation.controller";
import { ResultsController } from "../../results/controllers/results.controller";
import { PrismaService } from "../../../prisma/prisma.service";
import { EvaluationService } from "../services/evaluation.service";
import { EvaluationQueueService } from "../services/evaluation-queue.service";
import { ObjectiveEvaluatorService } from "../objective/objective-evaluator.service";
import { SectionScoringService } from "../scoring/section-scoring.service";
import { OverallScoreService } from "../scoring/overall-score.service";
import { EvaluationReliabilityService } from "../reliability/evaluation-reliability.service";
import { ReEvaluationService } from "../services/re-evaluation.service";
import { CandidateRankingService } from "../ranking/candidate-ranking.service";
import { AiInsightService } from "../insights/ai-insight.service";
import { ImprovementPlanService } from "../recommendations/improvement-plan.service";
import { ResultsService } from "../../results/services/results.service";
import { RecommendationsService } from "../../results/services/recommendations.service";
import { PercentileService } from "../ranking/percentile.service";
import { ResultGeneratorService } from "../services/result-generator.service";
import { ResultStorageService } from "../services/result-storage.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { ExecutionContext } from "@nestjs/common";

describe("Assessment Intelligence Integration (HTTP Stack)", () => {
  let app: INestApplication;

  const prismaMock = {
    testInstance: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    candidateResult: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    evaluationAnalytics: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn(),
    },
    evaluationInsight: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    improvementPlan: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    candidatePercentile: {
      upsert: jest.fn(),
    },
    candidateRanking: {
      upsert: jest.fn(),
    },
    evaluationReprocessLog: {
      create: jest.fn(),
    },
    evaluationRun: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    submission: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const llmAdapterMock = {
    generate: jest.fn().mockResolvedValue(JSON.stringify({ insights: [] })),
  };

  const resultsServiceMock = {
    getCandidateResult: jest.fn(),
    getResultDetails: jest.fn(),
  };

  const recommendationsServiceMock = {
    getRecommendations: jest.fn(),
  };

  const resultGeneratorMock = {
    generateResult: jest.fn(),
  };

  const resultStorageMock = {
    saveResult: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [EvaluationController, ResultsController],
      providers: [
        EvaluationReliabilityService,
        ReEvaluationService,
        CandidateRankingService,
        PercentileService,
        AiInsightService,
        ImprovementPlanService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: "LLM_ADAPTER",
          useValue: llmAdapterMock,
        },
        {
          provide: ResultGeneratorService,
          useValue: resultGeneratorMock,
        },
        {
          provide: ResultStorageService,
          useValue: resultStorageMock,
        },
        {
          provide: ResultsService,
          useValue: resultsServiceMock,
        },
        {
          provide: RecommendationsService,
          useValue: recommendationsServiceMock,
        },
        // Mock other controller deps that are not under test
        {
          provide: EvaluationService,
          useValue: {},
        },
        {
          provide: EvaluationQueueService,
          useValue: {},
        },
        {
          provide: ObjectiveEvaluatorService,
          useValue: {},
        },
        {
          provide: SectionScoringService,
          useValue: {},
        },
        {
          provide: OverallScoreService,
          useValue: {},
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: "candidate_123", role: "ADMIN" };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("GET /evaluation/reliability should return reliability report", async () => {
    const response = await request(app.getHttpServer())
      .get("/evaluation/reliability")
      .expect(200);

    expect(response.body).toEqual({
      missingScoresCount: 0,
      duplicateEvaluationsCount: 0,
      partialEvaluationsCount: 0,
      calculationFailuresCount: 0,
      anomalousAttempts: [],
    });
  });

  it("POST /evaluation/reprocess/:attemptId should trigger reprocess successfully", async () => {
    const mockAttempt = {
      id: "attempt_abc",
      userId: "candidate_123",
      submittedAt: new Date(),
      candidateAnswers: [],
      testConfig: { companyName: "Google" },
    };

    prismaMock.testInstance.findUnique.mockResolvedValue(mockAttempt);

    resultGeneratorMock.generateResult.mockResolvedValue({
      id: "res_abc",
      candidateId: "candidate_123",
      attemptId: "attempt_abc",
      score: 10,
      percentage: 100,
      createdAt: new Date(),
    });

    resultStorageMock.saveResult.mockResolvedValue(undefined);

    prismaMock.candidateResult.count.mockResolvedValue(1);

    const response = await request(app.getHttpServer())
      .post("/evaluation/reprocess/attempt_abc")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.attemptId).toBe("attempt_abc");
    expect(response.body.percentage).toBe(100);
  });

  it("GET /evaluation/analytics/platform should aggregate and return statistics", async () => {
    prismaMock.candidateResult.aggregate.mockResolvedValue({
      _avg: { percentage: 75.0 },
      _count: { id: 10 },
    });
    prismaMock.evaluationAnalytics.findMany.mockResolvedValue([
      { topicAccuracy: { math: 80 }, completionRate: 90, attemptRate: 90 },
    ]);
    prismaMock.candidateResult.findMany.mockResolvedValue([]);

    const response = await request(app.getHttpServer())
      .get("/evaluation/analytics/platform")
      .expect(200);

    expect(response.body.averageScore).toBe(75);
    expect(response.body.averageAccuracy).toBe(80);
    expect(response.body.topTopics).toEqual([
      { topicName: "math", averageAccuracy: 80 },
    ]);
  });
});
