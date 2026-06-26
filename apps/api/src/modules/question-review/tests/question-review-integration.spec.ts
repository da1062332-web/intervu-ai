import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { QuestionReviewController } from "../controllers/question-review.controller";
import { AIReviewService } from "../reviewers/ai-review.service";
import { GenerationMonitorService } from "../monitoring/generation-monitor.service";
import { ReviewAuditService } from "../services/review-audit.service";
import { QuestionRepository } from "../../question-bank/repositories/question.repository";
import { QuestionVersionRepository } from "../../question-bank/repositories/question-version.repository";
import { TopicRepository } from "../../concept-mapping/repositories/topic.repository";
import { StructureAnalyzerService } from "../analyzers/structure-analyzer.service";
import { DifficultyAnalyzerService } from "../analyzers/difficulty-analyzer.service";
import { TopicAnalyzerService } from "../analyzers/topic-analyzer.service";
import { QuestionAnalyticsService } from "../analyzers/question-analytics.service";
import { ApprovalEngineService } from "../reviewers/approval-engine.service";
import { QuestionEnrichmentService } from "../enrichers/question-enrichment.service";
import { ReviewAuditLogRepository } from "../repositories/review-audit-log.repository";
import { GenerationMetricsRepository } from "../repositories/generation-metrics.repository";
import { PrismaService } from "../../../prisma/prisma.service";

describe("Question Review Integration Tests", () => {
  let app: INestApplication;
  let controller: QuestionReviewController;
  let questionRepoMock: any;
  let versionRepoMock: any;
  let topicRepoMock: any;
  let prismaMock: any;

  beforeEach(async () => {
    questionRepoMock = {
      findById: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    };

    versionRepoMock = {
      findByQuestionId: jest.fn().mockResolvedValue([]),
    };

    topicRepoMock = {
      findById: jest.fn(),
    };

    prismaMock = {
      $transaction: jest.fn((callback) => callback(prismaMock)),
      question: {
        update: jest.fn().mockResolvedValue({ id: "q-123", version: 2, status: "ACTIVE" }),
      },
      questionVersion: {
        create: jest.fn(),
      },
      reviewAuditLog: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({}),
      },
      generationMetrics: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: "m-1" }),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [QuestionReviewController],
      providers: [
        AIReviewService,
        StructureAnalyzerService,
        DifficultyAnalyzerService,
        TopicAnalyzerService,
        QuestionAnalyticsService,
        ApprovalEngineService,
        QuestionEnrichmentService,
        ReviewAuditService,
        GenerationMonitorService,
        ReviewAuditLogRepository,
        GenerationMetricsRepository,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: QuestionRepository,
          useValue: questionRepoMock,
        },
        {
          provide: QuestionVersionRepository,
          useValue: versionRepoMock,
        },
        {
          provide: TopicRepository,
          useValue: topicRepoMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    controller = moduleFixture.get<QuestionReviewController>(QuestionReviewController);
  });

  afterEach(async () => {
    await app.close();
  });

  it("should retrieve queue through controller", async () => {
    questionRepoMock.findMany.mockResolvedValue([
      { id: "q-1", questionText: "Q1", status: "DRAFT" },
    ]);
    questionRepoMock.count.mockResolvedValue(1);

    const res = await controller.getQueue({ page: 1, limit: 10 });
    expect(res.questions.length).toBe(1);
    expect(res.total).toBe(1);
    expect(res.page).toBe(1);
  });

  it("should analyze question through controller", async () => {
    questionRepoMock.findById.mockResolvedValue({
      id: "q-1",
      questionText: "What is 20 percent of 100?",
      answer: "20",
      explanation: "20% is 20.",
      difficulty: "EASY",
      topicId: "t-1",
    });

    topicRepoMock.findById.mockResolvedValue({ id: "t-1", name: "Percentages" });
    versionRepoMock.findByQuestionId.mockResolvedValue([
      { snapshot: { options: ["10", "20", "30", "40"] } },
    ]);

    const res = await controller.analyzeQuestion("q-1");
    expect(res.recommendation).toBe("APPROVE");
    expect(res.score).toBeGreaterThan(80);
  });

  it("should support bulk review in parallel", async () => {
    questionRepoMock.findById.mockResolvedValue({
      id: "q-1",
      questionText: "What is 20 percent of 100?",
      answer: "20",
      explanation: "20% is 20.",
      difficulty: "EASY",
      topicId: "t-1",
    });

    topicRepoMock.findById.mockResolvedValue({ id: "t-1", name: "Percentages" });
    versionRepoMock.findByQuestionId.mockResolvedValue([
      { snapshot: { options: ["10", "20", "30", "40"] } },
    ]);

    const res = await controller.bulkReview({ questionIds: ["q-1"] });
    expect(res.results["q-1"]).toBeDefined();
    expect(res.results["q-1"].recommendation).toBe("APPROVE");
  });
});
